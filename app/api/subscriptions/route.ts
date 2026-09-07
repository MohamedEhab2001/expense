import { NextRequest, NextResponse } from "next/server";
import { listSubscriptions, createSubscription } from "@/lib/services/subscriptionService";
import { createSubscriptionSchema } from "@/lib/validation/subscription";

export async function GET() {
  const subscriptions = await listSubscriptions();
  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const subscription = await createSubscription(parsed.data);
  return NextResponse.json(subscription, { status: 201 });
}
