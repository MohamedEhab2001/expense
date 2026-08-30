"use client";

import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { formatCents } from "@/lib/utils/currency";

export function AnimatedCurrency({
  cents,
  currency = "EGP",
  duration = 600,
  className,
}: {
  cents: number;
  currency?: string;
  duration?: number;
  className?: string;
}) {
  const animated = useAnimatedNumber(cents, duration);
  return <span className={className}>{formatCents(Math.round(animated), currency)}</span>;
}
