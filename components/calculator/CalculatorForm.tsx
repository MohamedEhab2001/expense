"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/lib/queries";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY, toCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CalculatorFormValues {
  amount: number; // cents
  currency: string;
  isRecurring: boolean;
  note?: string;
}

export function CalculatorForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: CalculatorFormValues) => void;
  submitting: boolean;
}) {
  const { data: accounts } = useAccounts();

  const heldCurrencies = useMemo(() => {
    const codes = new Set((accounts ?? []).map((a) => a.currency));
    const known = CURRENCY_OPTIONS.filter((c) => codes.has(c.code));
    return known.length ? known : CURRENCY_OPTIONS;
  }, [accounts]);

  const [amount, setAmount] = useState("");
  // null = no manual pick yet; falls back to a currency the user actually holds once
  // accounts load, instead of leaving the picker stuck on EGP for e.g. a USD-only user.
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState("");

  const currency =
    currencyOverride && heldCurrencies.some((c) => c.code === currencyOverride)
      ? currencyOverride
      : heldCurrencies[0]?.code ?? DEFAULT_CURRENCY;

  function submit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    onSubmit({ amount: toCents(value), currency, isRecurring, note: note.trim() || undefined });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="calc-note">What are you thinking about buying?</Label>
        <Input
          id="calc-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="New laptop, gym membership, ..."
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="calc-amount">Amount</Label>
          <Input
            id="calc-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setCurrencyOverride(v ?? null)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {heldCurrencies.map(({ code }) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Is this one-time or recurring?</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isRecurring ? "outline" : "default"}
            className={cn("flex-1")}
            onClick={() => setIsRecurring(false)}
          >
            One-time
          </Button>
          <Button
            type="button"
            variant={isRecurring ? "default" : "outline"}
            className={cn("flex-1")}
            onClick={() => setIsRecurring(true)}
          >
            Recurring monthly
          </Button>
        </div>
      </div>

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting ? "Crunching the numbers..." : "Can I afford it?"}
      </Button>
    </div>
  );
}
