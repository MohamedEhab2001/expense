import { NextResponse } from "next/server";
import { getLocationBreakdown } from "@/lib/services/analyticsService";

export async function GET() {
  const breakdown = await getLocationBreakdown();
  return NextResponse.json({ breakdown });
}
