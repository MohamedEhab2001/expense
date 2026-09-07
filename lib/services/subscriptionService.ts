import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { monthlyEGPCost } from "@/lib/utils/subscriptions";
import type { z } from "zod";
import type { createSubscriptionSchema, updateSubscriptionSchema } from "@/lib/validation/subscription";

export { monthlyEGPCost };

export async function listSubscriptions(includeArchived = false) {
  await connectDB();
  const filter = includeArchived ? {} : { isArchived: false };
  return Subscription.find(filter).sort({ billingDay: 1 }).lean();
}

export async function getMonthlySubscriptionTotalEGP() {
  const subs = await listSubscriptions();
  return subs.reduce((sum, s) => sum + monthlyEGPCost(s), 0);
}

export async function createSubscription(input: z.infer<typeof createSubscriptionSchema>) {
  await connectDB();
  return Subscription.create(input);
}

export async function updateSubscription(id: string, input: z.infer<typeof updateSubscriptionSchema>) {
  await connectDB();
  return Subscription.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function archiveSubscription(id: string) {
  await connectDB();
  return Subscription.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}
