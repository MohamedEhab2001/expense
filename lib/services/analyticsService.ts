import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import "@/models/Category";
import { appNow, monthRange } from "@/lib/utils/dates";
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
import {
  getCurrentPeriod,
  getPeriodContaining,
  getRecentPeriods,
  periodLabel,
  periodShortLabel,
} from "./cycleService";

// With a calendar month key, breaks down that month; without one, the current home month.
export async function getCategoryBreakdown(key?: string) {
  await connectDB();
  const { start, end } = key ? monthRange(key) : await getCurrentPeriod();

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

// Income vs expense per home month (or calendar month, before any home month), oldest first.
export async function getMonthlyTrend(monthsBack = 6) {
  await connectDB();
  const periods = (await getRecentPeriods(monthsBack)).reverse();

  const results = await Promise.all(
    periods.map(async (period) => {
      const { start, end } = period;
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
        month: format(start, "yyyy-MM-dd"),
        label: periodShortLabel(period),
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

export async function getExpenseSummary(period: ExpensePeriod, referenceDate: Date = appNow()) {
  await connectDB();
  // "Month" follows home months, whose boundaries live in the database.
  const current =
    period === "month" ? await getPeriodContaining(referenceDate) : periodRange(period, referenceDate);
  const previous =
    period === "month"
      ? await getPeriodContaining(new Date(current.start.getTime() - 1))
      : periodRange(period, previousPeriodDate(period, referenceDate));
  const { start, end } = current;
  const { start: prevStart, end: prevEnd } = previous;

  const [total, previousTotal, breakdown] = await Promise.all([
    sumExpenses(start, end),
    sumExpenses(prevStart, prevEnd),
    expenseBreakdown(period, start, end),
  ]);

  return {
    period,
    date: referenceDate.toISOString(),
    rangeLabel:
      period === "month" ? periodLabel(current) : periodRangeLabel(period, referenceDate),
    start: start.toISOString(),
    end: end.toISOString(),
    total,
    previousTotal,
    breakdown,
  };
}

export async function getLocationBreakdown(monthsBack = 12) {
  await connectDB();
  const since = subMonths(appNow(), monthsBack);

  const rows = await Transaction.aggregate([
    { $match: { type: "expense", date: { $gte: since } } },
    {
      $group: {
        _id: { $ifNull: ["$location.governorate", { $ifNull: ["$location.city", "Unknown"] }] },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { amount: -1 } },
  ]);

  return rows.map((r) => ({ label: r._id as string, amount: r.amount as number }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Compares spending so far in the current home month (or calendar month, if no home month
// has been started) against the average of the previous three periods, scaled by elapsed time.
export async function getSpendingPace() {
  await connectDB();
  const now = appNow();
  const [current, ...past] = await getRecentPeriods(4, now);

  const [periodToDateExpense, pastTotals] = await Promise.all([
    sumExpenses(current.start, now),
    Promise.all(past.map((p) => sumExpenses(p.start, p.end))),
  ]);

  const validPast = past.filter((_, i) => pastTotals[i] > 0);
  const validPastTotals = pastTotals.filter((t) => t > 0);
  const avgPastPeriod = validPastTotals.length
    ? validPastTotals.reduce((s, t) => s + t, 0) / validPastTotals.length
    : 0;

  // A calendar month's length is known; a home month's isn't until the next one starts,
  // so estimate it from how long the previous periods lasted.
  const periodLengthMs = current.isCustom
    ? validPast.length
      ? validPast.reduce((s, p) => s + (p.end.getTime() - p.start.getTime()), 0) / validPast.length
      : 30 * DAY_MS
    : current.end.getTime() - current.start.getTime();
  const elapsedFraction = Math.min(1, (now.getTime() - current.start.getTime()) / periodLengthMs);

  const expectedPace = avgPastPeriod * elapsedFraction;
  const percentOfPace = expectedPace > 0 ? Math.round((periodToDateExpense / expectedPace) * 100) : null;

  return {
    monthToDateExpense: periodToDateExpense,
    expectedPace,
    percentOfPace,
    periodStart: current.start,
    isCustomPeriod: current.isCustom,
  };
}

export async function getNetWorthTrend(days = 30) {
  await connectDB();
  const accounts = await Account.find({ isArchived: false }).lean();
  const currentTotalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const now = appNow();
  const dayStarts = Array.from({ length: days }, (_, i) => startOfDay(subDays(now, days - 1 - i)));

  const dailyNets = await Promise.all(
    dayStarts.map(async (dayStart) => {
      const dayEnd = endOfDay(dayStart);
      const [incomeAgg, expenseAgg] = await Promise.all([
        Transaction.aggregate([
          { $match: { type: "income", date: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { type: "expense", date: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      return (incomeAgg[0]?.total ?? 0) - (expenseAgg[0]?.total ?? 0);
    })
  );

  // Walk backward from today's actual balance, undoing each day's net income/expense effect.
  // Transfers and ATM withdrawals move money between the user's own accounts, so they net to
  // zero and don't need to be considered here.
  const points: { date: string; label: string; netWorth: number }[] = new Array(days);
  let runningBalance = currentTotalBalance;
  for (let i = days - 1; i >= 0; i--) {
    points[i] = { date: format(dayStarts[i], "yyyy-MM-dd"), label: format(dayStarts[i], "MMM d"), netWorth: runningBalance };
    runningBalance -= dailyNets[i];
  }

  return points;
}
