import { NextRequest, NextResponse } from "next/server";
import { getCurrentPeriod, listCycles, startCycle } from "@/lib/services/cycleService";
import { startCycleSchema } from "@/lib/validation/cycle";

export async function GET() {
  const [current, cycles] = await Promise.all([getCurrentPeriod(), listCycles()]);
  return NextResponse.json({ current, cycles });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = startCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const cycle = await startCycle(parsed.data);
    return NextResponse.json(cycle, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
