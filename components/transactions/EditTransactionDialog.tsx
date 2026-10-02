"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { postJSON } from "@/lib/fetcher";
import { toCents } from "@/lib/utils/currency";
import { useCategories } from "@/lib/queries";
import type { TransactionDTO } from "@/lib/types";
import { toast } from "sonner";

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSaved,
}: {
  transaction: TransactionDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { data: categories } = useCategories();
  const [amount, setAmount] = useState(String(transaction.amount / 100));
  const [categoryId, setCategoryId] = useState(transaction.categoryId?._id ?? "");
  // Transaction dates are stored as UTC midnight of their day.
  const [date, setDate] = useState(transaction.date.slice(0, 10));
  const [note, setNote] = useState(transaction.note ?? "");
  const [saving, setSaving] = useState(false);

  const needsCategory = transaction.type === "expense" || transaction.type === "income";
  const kind = transaction.type === "income" ? "income" : "expense";
  const relevantCategories = categories?.filter((c) => c.kind === kind) ?? [];

  async function submit() {
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");
    if (needsCategory && !categoryId) return toast.error("Select a category");

    setSaving(true);
    try {
      // The update endpoint takes the whole transaction, so resend the fields this form doesn't edit.
      await postJSON(
        `/api/transactions/${transaction._id}`,
        {
          type: transaction.type,
          amount: cents,
          accountId: transaction.accountId._id,
          ...(needsCategory ? { categoryId } : { linkedAccountId: transaction.linkedAccountId?._id }),
          date,
          note: note.trim() || undefined,
          merchant: transaction.merchant,
          location: transaction.location,
        },
        "PATCH"
      );
      toast.success("Transaction updated");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-tx-amount">Amount</Label>
            <Input
              id="edit-tx-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>

          {needsCategory && (
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <CategoryPicker categories={relevantCategories} value={categoryId} onChange={setCategoryId} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-tx-date">Date</Label>
            <Input id="edit-tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-tx-note">Note</Label>
            <Input id="edit-tx-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
