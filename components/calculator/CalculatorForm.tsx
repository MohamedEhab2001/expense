"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { getIcon } from "@/lib/icon-map";
import { useAccounts, useBudgets } from "@/lib/queries";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY, toCents } from "@/lib/utils/currency";
import type { CalculatorInputDTO } from "@/lib/types";
import { toast } from "sonner";

interface TransferRowState {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
}

export function CalculatorForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: CalculatorInputDTO) => void;
  submitting: boolean;
}) {
  const { data: accounts } = useAccounts();
  const { data: budgetsData } = useBudgets();

  const heldCurrencies = useMemo(() => {
    const codes = new Set((accounts ?? []).map((a) => a.currency));
    const known = CURRENCY_OPTIONS.filter((c) => codes.has(c.code));
    return known.length ? known : CURRENCY_OPTIONS;
  }, [accounts]);

  // null = no manual pick yet; falls back to a currency the user actually holds once
  // accounts load, instead of leaving the picker stuck on EGP for e.g. a USD-only user.
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const currency =
    currencyOverride && heldCurrencies.some((c) => c.code === currencyOverride)
      ? currencyOverride
      : heldCurrencies[0]?.code ?? DEFAULT_CURRENCY;

  const currencyAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.currency === currency),
    [accounts, currency]
  );
  // Savings can't be the pay-from account — that's the whole point of excluding it.
  const payFromCandidates = useMemo(
    () => currencyAccounts.filter((a) => a.type !== "savings"),
    [currencyAccounts]
  );

  const [payFromOverride, setPayFromOverride] = useState<string | null>(null);
  const payFromAccountId =
    payFromOverride && payFromCandidates.some((a) => a._id === payFromOverride)
      ? payFromOverride
      : payFromCandidates[0]?._id ?? "";

  // Base UI's <Select.Value> only resolves a selected item's label from its rendered
  // <Select.Item>s, which don't mount until the popup has been opened once — otherwise it
  // falls back to showing the raw value. Passing `items` lets it resolve the label upfront.
  const currencyItems = useMemo(
    () => Object.fromEntries(heldCurrencies.map(({ code }) => [code, code])),
    [heldCurrencies]
  );
  const accountItems = useMemo(
    () => Object.fromEntries(currencyAccounts.map((a) => [a._id, a.name])),
    [currencyAccounts]
  );
  const payFromItems = useMemo(
    () => Object.fromEntries(payFromCandidates.map((a) => [a._id, a.name])),
    [payFromCandidates]
  );

  // Every expense category, defaulting its planned amount to its current /budgets amount
  // (0 if it has none) — editable inline for this run.
  const categoryDefaults = useMemo(() => {
    if (!budgetsData) return [];
    const fromBudgets = budgetsData.budgets.map((b) => ({
      categoryId: b.category._id,
      name: b.category.name,
      icon: b.category.icon ?? "tag",
      defaultAmount: b.budgeted,
    }));
    const fromUnbudgeted = budgetsData.unbudgetedCategories.map((c) => ({
      categoryId: c._id,
      name: c.name,
      icon: c.icon,
      defaultAmount: 0,
    }));
    return [...fromBudgets, ...fromUnbudgeted];
  }, [budgetsData]);

  const [amountOverrides, setAmountOverrides] = useState<Record<string, string>>({});
  const [transfers, setTransfers] = useState<TransferRowState[]>([]);
  const [note, setNote] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  function addTransfer() {
    if (currencyAccounts.length < 2 || !payFromAccountId) return;
    // Default to "some other account -> the pay-from account" since that's the transfer
    // that actually affects whether you can afford the purchase.
    const other = currencyAccounts.find((a) => a._id !== payFromAccountId) ?? currencyAccounts[0];
    setTransfers((prev) => [...prev, { fromAccountId: other._id, toAccountId: payFromAccountId, amount: "" }]);
  }

  function updateTransfer(index: number, patch: Partial<TransferRowState>) {
    setTransfers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTransfer(index: number) {
    setTransfers((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!payFromAccountId) {
      toast.error("Add a non-savings account to pay from first");
      return;
    }
    const purchase = Number(purchaseAmount);
    if (!purchase || purchase <= 0) {
      toast.error("Enter an amount greater than 0 for the purchase");
      return;
    }

    const categoryPlan = categoryDefaults
      .map((cat) => {
        const raw = amountOverrides[cat.categoryId] ?? String(cat.defaultAmount / 100);
        return { categoryId: cat.categoryId, amount: toCents(Number(raw) || 0) };
      })
      .filter((c) => c.amount > 0);

    const validTransfers = transfers
      .filter((t) => t.fromAccountId && t.toAccountId && t.fromAccountId !== t.toAccountId && Number(t.amount) > 0)
      .map((t) => ({
        fromAccountId: t.fromAccountId,
        toAccountId: t.toAccountId,
        amount: toCents(Number(t.amount)),
      }));

    onSubmit({
      payFromAccountId,
      categoryPlan,
      transfers: validTransfers,
      purchaseAmount: toCents(purchase),
      isRecurring,
      note: note.trim() || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setCurrencyOverride(v ?? null)} items={currencyItems}>
            <SelectTrigger className="w-full min-w-0">
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

        <div className="flex flex-col gap-1.5">
          <Label>Pay from</Label>
          {payFromCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need a non-savings account in {currency} to pay from.
            </p>
          ) : (
            <Select value={payFromAccountId} onValueChange={(v) => setPayFromOverride(v ?? null)} items={payFromItems}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {payFromCandidates.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">1. How will you spend money this month?</p>
        {categoryDefaults.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expense categories yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {categoryDefaults.map((cat) => {
              const Icon = getIcon(cat.icon);
              const value = amountOverrides[cat.categoryId] ?? String(cat.defaultAmount / 100);
              return (
                <div key={cat.categoryId} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{cat.name}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setAmountOverrides((prev) => ({ ...prev, [cat.categoryId]: e.target.value }))}
                    className="w-24"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">2. Planning any transfers?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTransfer}
            disabled={currencyAccounts.length < 2 || !payFromAccountId}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {currencyAccounts.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            You need at least 2 accounts in {currency} to plan a transfer.
          </p>
        ) : transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Only transfers into or out of your pay-from account affect the result below.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {transfers.map((t, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-xs text-muted-foreground">From</span>
                  <Select
                    value={t.fromAccountId}
                    onValueChange={(v) => v && updateTransfer(i, { fromAccountId: v })}
                    items={accountItems}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyAccounts.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-xs text-muted-foreground">To</span>
                  <Select
                    value={t.toAccountId}
                    onValueChange={(v) => v && updateTransfer(i, { toAccountId: v })}
                    items={accountItems}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyAccounts.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {t.fromAccountId !== payFromAccountId && t.toAccountId !== payFromAccountId && (
                  <p className="pl-11 text-xs text-warning">Doesn&apos;t touch your pay-from account — won&apos;t affect the result.</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-9 shrink-0" aria-hidden />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={t.amount}
                    onChange={(e) => updateTransfer(i, { amount: e.target.value })}
                    className="min-w-0"
                  />
                  <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" onClick={() => removeTransfer(i)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">3. What do you want to buy?</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-note">Item</Label>
          <Input
            id="calc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="New laptop, gym membership, ..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-amount">Amount</Label>
          <Input
            id="calc-amount"
            type="number"
            inputMode="decimal"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Is this one-time or recurring?</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isRecurring ? "outline" : "default"}
              className="flex-1"
              onClick={() => setIsRecurring(false)}
            >
              One-time
            </Button>
            <Button
              type="button"
              variant={isRecurring ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsRecurring(true)}
            >
              Recurring monthly
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting ? "Crunching the numbers..." : "Can I afford it?"}
      </Button>
    </div>
  );
}
