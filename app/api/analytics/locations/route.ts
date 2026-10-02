import { NextRequest, NextResponse } from "next/server";
import { getLocationBreakdown } from "@/lib/services/analyticsService";
import { rangeFromParams } from "@/lib/utils/dates";

export async function GET(req: NextRequest) {
  const breakdown = await getLocationBreakdown(rangeFromParams(req.nextUrl.searchParams));
  return NextResponse.json({ breakdown });
}
