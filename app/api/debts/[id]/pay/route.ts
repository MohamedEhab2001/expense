import { NextRequest, NextResponse } from "next/server";
import { markDebtPaid } from "@/lib/services/debtService";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const debt = await markDebtPaid(id);
    return NextResponse.json(debt);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
