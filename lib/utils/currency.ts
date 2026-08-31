// Currencies the app knows about. "Gold" isn't an ISO 4217 code (it's a
// physical holding tracked in grams), so it's formatted separately below.
export const CURRENCY_OPTIONS = [
  { code: "EGP", label: "EGP — Egyptian Pound" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "Gold", label: "Gold (grams)" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "EGP";

export function isGoldCurrency(currency: string): boolean {
  return currency === "Gold";
}

export function formatCents(cents: number, currency: string = DEFAULT_CURRENCY): string {
  if (isGoldCurrency(currency)) {
    return `${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(cents / 100);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Sums an amount (in cents) per currency, keyed by currency code. */
export function groupByCurrency<T>(
  items: T[],
  getCurrency: (item: T) => string,
  getAmount: (item: T) => number
): { currency: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const currency = getCurrency(item);
    totals.set(currency, (totals.get(currency) ?? 0) + getAmount(item));
  }
  const order = CURRENCY_OPTIONS.map((c) => c.code as string);
  return Array.from(totals.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => {
      const ai = order.indexOf(a.currency);
      const bi = order.indexOf(b.currency);
      if (ai === -1 && bi === -1) return a.currency.localeCompare(b.currency);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}
