import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import "@/models/Category";
import { monthKey, monthRange } from "@/lib/utils/dates";
import { format, subMonths } from "date-fns";

export async function getCategoryBreakdown(key: string = monthKey()) {
  await connectDB();
  const { start, end } = monthRange(key);

  const rows = await Transaction.aggregate([
    { $match: { type: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$categoryId", amount: { $sum: "$amount" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
    { $unwind: "$cat" },
    { $sort: { amount: -1 } },
  ]);

  return rows.map((r) => ({
    categoryId: String(r._id),
    name: r.cat.name as string,
    icon: r.cat.icon as string,
    color: r.cat.color as string,
    amount: r.amount as number,
  }));
}

export async function getMonthlyTrend(monthsBack = 6) {
  await connectDB();
  const now = new Date();
  const keys = Array.from({ length: monthsBack }, (_, i) => monthKey(subMonths(now, monthsBack - 1 - i)));

  const results = await Promise.all(
    keys.map(async (key) => {
      const { start, end } = monthRange(key);
      const [incomeAgg, expenseAgg] = await Promise.all([
        Transaction.aggregate([
          { $match: { type: "income", date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { type: "expense", date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      return {
        month: key,
        label: format(start, "MMM"),
        income: incomeAgg[0]?.total ?? 0,
        expense: expenseAgg[0]?.total ?? 0,
      };
    })
  );

  return results;
}
