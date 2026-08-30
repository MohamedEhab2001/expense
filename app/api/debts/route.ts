import { NextRequest, NextResponse } from "next/server";
import { listDebts, createDebt } from "@/lib/services/debtService";
import { createDebtSchema } from "@/lib/validation/debt";

export async function GET() {
  const debts = await listDebts();
  return NextResponse.json(debts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const debt = await createDebt(parsed.data);
  return NextResponse.json(debt, { status: 201 });
}
