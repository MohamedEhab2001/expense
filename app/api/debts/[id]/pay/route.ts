import { NextRequest, NextResponse } from "next/server";
import { markDebtPaid } from "@/lib/services/debtService";
import { payDebtSchema } from "@/lib/validation/debt";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = payDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const debt = await markDebtPaid(id, parsed.data.amount);
    return NextResponse.json(debt);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
