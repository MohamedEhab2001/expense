import { NextRequest, NextResponse } from "next/server";
import { updateSubscription, archiveSubscription } from "@/lib/services/subscriptionService";
import { updateSubscriptionSchema } from "@/lib/validation/subscription";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const subscription = await updateSubscription(id, parsed.data);
  return NextResponse.json(subscription);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subscription = await archiveSubscription(id);
  return NextResponse.json(subscription);
}
