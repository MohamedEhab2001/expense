import { NextRequest, NextResponse } from "next/server";
import { getAccount, updateAccount, archiveAccount } from "@/lib/services/accountService";
import { updateAccountSchema } from "@/lib/validation/account";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await updateAccount(id, parsed.data);
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await archiveAccount(id);
  return NextResponse.json(account);
}
