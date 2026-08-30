import { NextRequest, NextResponse } from "next/server";
import { contributeToGoal } from "@/lib/services/goalService";
import { contributeGoalSchema } from "@/lib/validation/goal";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = contributeGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const goal = await contributeToGoal(id, parsed.data.amount);
    return NextResponse.json(goal);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
