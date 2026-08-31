import { NextRequest, NextResponse } from "next/server";
import { getExpenseSummary } from "@/lib/services/analyticsService";
import type { ExpensePeriod } from "@/lib/types";

const VALID_PERIODS: ExpensePeriod[] = ["day", "month", "quarter", "year"];

export async function GET(req: NextRequest) {
  const periodParam = req.nextUrl.searchParams.get("period") ?? "month";
  const period = VALID_PERIODS.includes(periodParam as ExpensePeriod) ? (periodParam as ExpensePeriod) : "month";
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  const summary = await getExpenseSummary(period, isNaN(date.getTime()) ? new Date() : date);
  return NextResponse.json(summary);
}
