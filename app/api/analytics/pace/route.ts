import { NextResponse } from "next/server";
import { getSpendingPace } from "@/lib/services/analyticsService";

export async function GET() {
  const pace = await getSpendingPace();
  return NextResponse.json(pace);
}
