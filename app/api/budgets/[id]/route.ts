import { NextRequest, NextResponse } from "next/server";
import { deleteBudget } from "@/lib/services/budgetService";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteBudget(id);
  return NextResponse.json({ ok: true });
}
