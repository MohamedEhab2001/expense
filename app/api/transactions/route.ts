import { NextRequest, NextResponse } from "next/server";
import { listTransactions, createTransaction } from "@/lib/services/transactionService";
import { createTransactionSchema } from "@/lib/validation/transaction";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const transactions = await listTransactions({
    accountId: sp.get("accountId") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    type: sp.get("type") ?? undefined,
    from: sp.get("from") ? new Date(sp.get("from")!) : undefined,
    to: sp.get("to") ? new Date(sp.get("to")!) : undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    cursor: sp.get("cursor") ?? undefined,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const transaction = await createTransaction(parsed.data);
    return NextResponse.json(transaction, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
