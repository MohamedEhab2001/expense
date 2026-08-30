import { NextRequest, NextResponse } from "next/server";
import { updateDebt, archiveDebt } from "@/lib/services/debtService";
import { updateDebtSchema } from "@/lib/validation/debt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const debt = await updateDebt(id, parsed.data);
  return NextResponse.json(debt);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const debt = await archiveDebt(id);
  return NextResponse.json(debt);
}
