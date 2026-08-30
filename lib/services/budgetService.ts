import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Budget from "@/models/Budget";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";
import { monthKey, monthRange, previousMonthKey } from "@/lib/utils/dates";
import type { z } from "zod";
import type { upsertBudgetSchema } from "@/lib/validation/budget";

async function spentForMonth(categoryId: string, key: string) {
  const { start, end } = monthRange(key);
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

export async function getMonthlyBudgetStatus(key: string = monthKey()) {
  await connectDB();
  const budgets = await Budget.find().populate("categoryId", "name icon color").lean();

  return Promise.all(
    budgets.map(async (budget) => {
      const categoryId = String(budget.categoryId._id ?? budget.categoryId);
      const spent = await spentForMonth(categoryId, key);

      let effectiveBudget = budget.amount;
      if (budget.rollover) {
        const prevKey = previousMonthKey(key);
        const prevSpent = await spentForMonth(categoryId, prevKey);
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
