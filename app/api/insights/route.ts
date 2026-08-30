import { NextResponse } from "next/server";
import { listInsights } from "@/lib/services/insightService";

export async function GET() {
  const insights = await listInsights();
  return NextResponse.json(insights);
}
