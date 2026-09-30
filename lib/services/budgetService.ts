import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Budget from "@/models/Budget";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";
import { monthRange, previousMonthKey } from "@/lib/utils/dates";
import { getRecentPeriods } from "./cycleService";
import type { z } from "zod";
import type { upsertBudgetSchema } from "@/lib/validation/budget";

type Range = { start: Date; end: Date };

async function spentInRange(categoryId: string, { start, end }: Range) {
  const result = await Transaction.aggregate([
    {
      $match: {
        categoryId: new mongoose.Types.ObjectId(categoryId),
        type: "expense",
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total ?? 0;
}

// With a calendar month key, reports that month; without one, reports the current home month.
export async function getMonthlyBudgetStatus(key?: string) {
  await connectDB();
  const [current, previous] = key
    ? [monthRange(key), monthRange(previousMonthKey(key))]
    : await getRecentPeriods(2);
  const budgets = await Budget.find().populate("categoryId", "name icon color").lean();

  return Promise.all(
    budgets.map(async (budget) => {
      const categoryId = String(budget.categoryId._id ?? budget.categoryId);
      const spent = await spentInRange(categoryId, current);

      let effectiveBudget = budget.amount;
      if (budget.rollover) {
        const prevSpent = await spentInRange(categoryId, previous);
        effectiveBudget += Math.max(0, budget.amount - prevSpent);
      }

      return {
        _id: budget._id,
        category: budget.categoryId,
        budgeted: effectiveBudget,
        spent,
        percentUsed: effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0,
        rollover: budget.rollover,
      };
    })
  );
}

export async function upsertBudget(input: z.infer<typeof upsertBudgetSchema>) {
  await connectDB();
  return Budget.findOneAndUpdate(
    { categoryId: input.categoryId },
    { amount: input.amount, rollover: input.rollover },
    { upsert: true, new: true }
  ).lean();
}

export async function deleteBudget(id: string) {
  await connectDB();
  await Budget.findByIdAndDelete(id);
}

export async function listUnbudgetedCategories() {
  await connectDB();
  const budgeted = await Budget.find().distinct("categoryId");
  return Category.find({ kind: "expense", isArchived: false, _id: { $nin: budgeted } }).lean();
}
