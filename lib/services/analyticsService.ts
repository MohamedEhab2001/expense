import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import "@/models/Category";
import { monthKey, monthRange } from "@/lib/utils/dates";
import {
  format,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subQuarters,
  subYears,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import type { ExpensePeriod } from "@/lib/types";

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

function periodRange(period: ExpensePeriod, date: Date): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "quarter":
      return { start: startOfQuarter(date), end: endOfQuarter(date) };
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}

function previousPeriodDate(period: ExpensePeriod, date: Date): Date {
  switch (period) {
    case "day":
      return subDays(date, 1);
    case "month":
      return subMonths(date, 1);
    case "quarter":
      return subQuarters(date, 1);
    case "year":
      return subYears(date, 1);
  }
}

function periodRangeLabel(period: ExpensePeriod, date: Date): string {
  switch (period) {
    case "day":
      return format(date, "MMM d, yyyy");
    case "month":
      return format(date, "MMMM yyyy");
    case "quarter":
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case "year":
      return format(date, "yyyy");
  }
}

async function sumExpenses(start: Date, end: Date) {
  await connectDB();
  const result = await Transaction.aggregate([
    { $match: { type: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total ?? 0;
}

async function expenseBreakdown(period: ExpensePeriod, start: Date, end: Date) {
  if (period === "day") {
    const rows = await Transaction.aggregate([
      { $match: { type: "expense", date: { $gte: start, $lte: end } } },
      { $group: { _id: "$categoryId", amount: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      { $sort: { amount: -1 } },
    ]);
    return rows.map((r) => ({ label: r.cat.name as string, amount: r.amount as number, color: r.cat.color as string }));
  }

  const buckets = period === "month" ? eachDayOfInterval({ start, end }) : eachMonthOfInterval({ start, end });
  const labelFormat = period === "month" ? "d" : "MMM";

  return Promise.all(
    buckets.map(async (bucketStart) => {
      const bucketEnd = period === "month" ? endOfDay(bucketStart) : endOfMonth(bucketStart);
      const amount = await sumExpenses(bucketStart, bucketEnd);
      return { label: format(bucketStart, labelFormat), amount };
    })
  );
}

export async function getExpenseSummary(period: ExpensePeriod, referenceDate: Date = new Date()) {
  await connectDB();
  const { start, end } = periodRange(period, referenceDate);
  const { start: prevStart, end: prevEnd } = periodRange(period, previousPeriodDate(period, referenceDate));

  const [total, previousTotal, breakdown] = await Promise.all([
    sumExpenses(start, end),
    sumExpenses(prevStart, prevEnd),
    expenseBreakdown(period, start, end),
  ]);

  return {
    period,
    date: referenceDate.toISOString(),
    rangeLabel: periodRangeLabel(period, referenceDate),
    total,
    previousTotal,
    breakdown,
  };
}
