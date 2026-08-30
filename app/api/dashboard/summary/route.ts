import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/services/dashboardService";

export async function GET() {
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
