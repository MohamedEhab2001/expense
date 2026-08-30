import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createAccount } from "@/lib/services/accountService";
import { createAccountSchema } from "@/lib/validation/account";

export async function GET() {
  const accounts = await listAccounts();
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await createAccount(parsed.data);
  return NextResponse.json(account, { status: 201 });
}
