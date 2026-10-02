import { NextRequest, NextResponse } from "next/server";
import { getCategoryBreakdown, getMonthlyTrend } from "@/lib/services/analyticsService";
import { rangeFromParams } from "@/lib/utils/dates";

export async function GET(req: NextRequest) {
  const range = rangeFromParams(req.nextUrl.searchParams);
  const [categoryBreakdown, trend] = await Promise.all([
    getCategoryBreakdown(range),
    getMonthlyTrend(6, range?.end),
  ]);
  return NextResponse.json({ categoryBreakdown, trend });
}
