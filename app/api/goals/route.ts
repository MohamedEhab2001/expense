import { NextRequest, NextResponse } from "next/server";
import { listGoals, createGoal } from "@/lib/services/goalService";
import { createGoalSchema } from "@/lib/validation/goal";

export async function GET() {
  const goals = await listGoals();
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const goal = await createGoal(parsed.data);
  return NextResponse.json(goal, { status: 201 });
}
