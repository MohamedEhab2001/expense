import { NextRequest, NextResponse } from "next/server";
import { updateTransactionLocation } from "@/lib/services/transactionService";
import { updateLocationSchema } from "@/lib/validation/transaction";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const transaction = await updateTransactionLocation(id, parsed.data);
    return NextResponse.json(transaction);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
