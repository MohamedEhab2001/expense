import { NextRequest, NextResponse } from "next/server";
import { getNetWorthTrend } from "@/lib/services/analyticsService";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days")) || 30;
  const points = await getNetWorthTrend(Math.min(365, Math.max(7, days)));
  return NextResponse.json(points);
}
