import { connectDB } from "@/lib/db";
import Budget from "@/models/Budget";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";
import { appNow, monthRange, previousMonthKey } from "@/lib/utils/dates";
import { estimatedPeriodLengthMs, getRecentPeriods } from "./cycleService";
import type { z } from "zod";
import type { upsertBudgetSchema } from "@/lib/validation/budget";

type Range = { start: Date; end: Date };
type CategoryLite = { _id: unknown; name: string; icon: string; color: string; parentId?: unknown; isArchived?: boolean };

async function spentByCategory({ start, end }: Range) {
  const rows = await Transaction.aggregate([
    { $match: { type: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
  ]);
  return new Map<string, number>(rows.map((r) => [String(r._id), r.total as number]));
}

// With a calendar month key, reports that month; without one, reports the current home month.
// A budget on a parent category covers spending in the parent and all of its subcategories.
export async function getMonthlyBudgetStatus(key?: string) {
  await connectDB();
  const [current, previous] = key
    ? [monthRange(key), monthRange(previousMonthKey(key))]
    : await getRecentPeriods(2);
  const [budgets, categories, spentNow, spentBefore] = await Promise.all([
    Budget.find().populate("categoryId", "name icon color parentId").lean(),
    Category.find().select("name icon color parentId isArchived").lean<CategoryLite[]>(),
    spentByCategory(current),
    spentByCategory(previous),
  ]);

  const childrenOf = new Map<string, CategoryLite[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const parentId = String(c.parentId);
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), c]);
  }
  const budgetedIds = new Set(budgets.map((b) => String((b.categoryId as unknown as CategoryLite)?._id)));

  return budgets
    .filter((budget) => budget.categoryId) // skip budgets whose category no longer exists
    .map((budget) => {
      const category = budget.categoryId as unknown as CategoryLite;
      const categoryId = String(category._id);
      const children = childrenOf.get(categoryId) ?? [];
      const ids = [categoryId, ...children.map((c) => String(c._id))];
      const total = (spent: Map<string, number>) => ids.reduce((s, id) => s + (spent.get(id) ?? 0), 0);

      const spent = total(spentNow);
      let effectiveBudget = budget.amount;
      if (budget.rollover) {
        effectiveBudget += Math.max(0, budget.amount - total(spentBefore));
      }

      // Per-category split of a parent's spending: its own transactions first, then each child.
      const breakdown = children.length
        ? [category, ...children]
            .map((c) => ({
              category: { _id: String(c._id), name: c.name, icon: c.icon, color: c.color },
              spent: spentNow.get(String(c._id)) ?? 0,
            }))
            .filter((b, i) => i === 0 || b.spent > 0 || !children[i - 1].isArchived)
        : undefined;

      const parentId = category.parentId ? String(category.parentId) : null;
      return {
        _id: String(budget._id),
        category: { _id: categoryId, name: category.name, icon: category.icon, color: category.color, parentId },
        amount: budget.amount,
        budgeted: effectiveBudget,
        spent,
        percentUsed: effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0,
        rollover: budget.rollover,
        isGroup: children.length > 0,
        breakdown,
        // A subcategory budget sits inside its parent's budget when that's set, so it
        // mustn't be added to totals a second time.
        countsTowardTotal: !(parentId && budgetedIds.has(parentId)),
      };
    });
}

const DAY_MS = 24 * 60 * 60 * 1000;

// The window budgets are measured over, with how far into it we are (0–1) for pace markers.
export async function getBudgetPeriod(key?: string) {
  const now = appNow();
  let start: Date, end: Date;
  if (key) {
    ({ start, end } = monthRange(key));
  } else {
    const [current, ...past] = await getRecentPeriods(4, now);
    start = current.start;
    end = new Date(start.getTime() + estimatedPeriodLengthMs(current, past.filter((p) => p.isCustom)));
  }
  const elapsed = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  return {
    start,
    end,
    elapsedFraction: Math.min(1, Math.max(0, elapsed)),
    daysLeft: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS)),
  };
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
