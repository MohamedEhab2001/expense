"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, TrendingDown, TrendingUp } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { toCents } from "@/lib/utils/currency";
import { getIcon } from "@/lib/icon-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAccounts, useCategories, useInvalidate } from "@/lib/queries";
import type { TransactionType } from "@/lib/types";
import { toast } from "sonner";

const TYPES: { value: TransactionType; label: string; icon: typeof TrendingDown }[] = [
  { value: "expense", label: "Expense", icon: TrendingDown },
  { value: "income", label: "Income", icon: TrendingUp },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "atm_withdrawal", label: "ATM", icon: Banknote },
];

export default function NewTransactionPage() {
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: categories } = useCategories();
  const invalidate = useInvalidate();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const relevantCategories = useMemo(
    () => categories?.filter((c) => c.kind === (type === "income" ? "income" : "expense")) ?? [],
    [categories, type]
  );

  const needsCategory = type === "expense" || type === "income";
  const needsLinkedAccount = type === "transfer" || type === "atm_withdrawal";

  async function submit() {
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");
    if (!accountId) return toast.error(needsLinkedAccount ? "Select a source account" : "Select an account");
    if (needsCategory && !categoryId) return toast.error("Select a category");
    if (needsLinkedAccount && !linkedAccountId) return toast.error("Select a destination account");
    if (needsLinkedAccount && linkedAccountId === accountId) return toast.error("Accounts must be different");

    setSaving(true);
    try {
      await postJSON("/api/transactions", {
        type,
        amount: cents,
        accountId,
        ...(needsCategory ? { categoryId } : {}),
        ...(needsLinkedAccount ? { linkedAccountId } : {}),
        date,
        note: note.trim() || undefined,
      });
      toast.success("Transaction saved");
      invalidate.all();
      router.push("/transactions");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const noAccounts = accounts && accounts.length === 0;

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-4">
      <h1 className="text-xl font-semibold">Add transaction</h1>

      {accountsLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : noAccounts ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Add an account first before logging transactions.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors",
                  type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1 py-4">
            <span className="text-sm text-muted-foreground">Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-semibold text-muted-foreground">E£</span>
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-40 bg-transparent text-center text-4xl font-semibold tabular-nums outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{needsLinkedAccount ? "From" : "Account"}</Label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsLinkedAccount && (
            <div className="flex flex-col gap-1.5">
              <Label>{type === "atm_withdrawal" ? "To (cash)" : "To"}</Label>
              <Select value={linkedAccountId} onValueChange={(v) => setLinkedAccountId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter((a) => a._id !== accountId).map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsCategory && (
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {relevantCategories.map((cat) => {
                  const Icon = getIcon(cat.icon);
                  const active = categoryId === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setCategoryId(cat._id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-date">Date</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-note">Note (optional)</Label>
            <Input id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" />
          </div>

          <Button onClick={submit} disabled={saving} size="lg" className="mt-2">
            {saving ? "Saving..." : "Save transaction"}
          </Button>
        </>
      )}
    </div>
  );
}
