import { NextRequest, NextResponse } from "next/server";
import { getCategoryBreakdown, getMonthlyTrend } from "@/lib/services/analyticsService";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") ?? undefined;
  const [categoryBreakdown, trend] = await Promise.all([
    getCategoryBreakdown(month),
    getMonthlyTrend(6),
  ]);
  return NextResponse.json({ categoryBreakdown, trend });
}
