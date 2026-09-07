/**
 * Normalizes a subscription's cost to a monthly EGP figure, using its own exchange rate.
 * Paused subscriptions (isActive: false) cost 0 — they're kept around but don't count toward the total.
 */
export function monthlyEGPCost(sub: {
  amount: number;
  exchangeRate?: number | null;
  billingCycle: string;
  isActive?: boolean;
}): number {
  if (sub.isActive === false) return 0;
  const egpAmount = Math.round(sub.amount * (sub.exchangeRate ?? 1));
  return sub.billingCycle === "yearly" ? Math.round(egpAmount / 12) : egpAmount;
}
