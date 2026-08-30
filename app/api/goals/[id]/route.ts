import { NextRequest, NextResponse } from "next/server";
import { updateGoal, archiveGoal } from "@/lib/services/goalService";
import { updateGoalSchema } from "@/lib/validation/goal";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const goal = await updateGoal(id, parsed.data);
  return NextResponse.json(goal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = await archiveGoal(id);
  return NextResponse.json(goal);
}
