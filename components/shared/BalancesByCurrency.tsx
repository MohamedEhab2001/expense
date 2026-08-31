"use client";

import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";

/**
 * Renders one balance per currency instead of blending unrelated currencies
 * into a single (meaningless) number. The default currency is shown large;
 * any others appear as smaller chips beneath it.
 */
export function BalancesByCurrency({
  balances,
  label,
}: {
  balances: { currency: string; amount: number }[];
  label?: string;
}) {
  if (balances.length === 0) {
    return (
      <>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <p className="text-2xl font-semibold tabular-nums">
          <AnimatedCurrency cents={0} />
        </p>
      </>
    );
  }

  const [primary, ...rest] = balances.some((b) => b.currency === DEFAULT_CURRENCY)
    ? [
        balances.find((b) => b.currency === DEFAULT_CURRENCY)!,
        ...balances.filter((b) => b.currency !== DEFAULT_CURRENCY),
      ]
    : balances;

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <p className="text-2xl font-semibold tabular-nums">
        <AnimatedCurrency cents={primary.amount} currency={primary.currency} />
      </p>
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {rest.map((b) => (
            <span
              key={b.currency}
              className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
            >
              <AnimatedCurrency cents={b.amount} currency={b.currency} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
