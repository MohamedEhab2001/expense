import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, deleteSubscription } from "@/lib/services/pushService";
import { subscribeSchema, unsubscribeSchema } from "@/lib/validation/push";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await saveSubscription(parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await deleteSubscription(parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
