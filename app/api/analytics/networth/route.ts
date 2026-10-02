import { NextRequest, NextResponse } from "next/server";
import { getNetWorthTrend } from "@/lib/services/analyticsService";
import { rangeFromParams } from "@/lib/utils/dates";

export async function GET(req: NextRequest) {
  const points = await getNetWorthTrend(rangeFromParams(req.nextUrl.searchParams));
  return NextResponse.json(points);
}
