import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function saveSubscription(input: SubscriptionInput) {
  await connectDB();
  return PushSubscription.findOneAndUpdate(
    { endpoint: input.endpoint },
    { endpoint: input.endpoint, keys: input.keys },
    { upsert: true, new: true }
  ).lean();
}

export async function deleteSubscription(endpoint: string) {
  await connectDB();
  await PushSubscription.deleteOne({ endpoint });
}

export async function listSubscriptions() {
  await connectDB();
  return PushSubscription.find().lean();
}
