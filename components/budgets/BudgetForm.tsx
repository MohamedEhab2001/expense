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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postJSON } from "@/lib/fetcher";
import { toCents } from "@/lib/utils/currency";
import type { CategoryDTO, BudgetStatusDTO } from "@/lib/types";
import { toast } from "sonner";

export function BudgetForm({
  open,
  onOpenChange,
  unbudgetedCategories,
  editingBudget,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unbudgetedCategories: CategoryDTO[];
  editingBudget?: BudgetStatusDTO;
  onSaved: () => void;
}) {
  const isEdit = !!editingBudget;
  const [categoryId, setCategoryId] = useState(editingBudget?.category._id ?? "");
  const [amount, setAmount] = useState(editingBudget ? String(editingBudget.budgeted / 100) : "");
  const [rollover, setRollover] = useState(editingBudget?.rollover ?? false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!categoryId) return toast.error("Select a category");
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");

    setSaving(true);
    try {
      await postJSON("/api/budgets", { categoryId, amount: cents, rollover });
      toast.success("Budget saved");
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
          <DialogTitle>{isEdit ? "Edit budget" : "Set a budget"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {unbudgetedCategories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-amount">Monthly amount</Label>
            <Input
              id="budget-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Roll over unspent</p>
              <p className="text-xs text-muted-foreground">Add last month&apos;s leftover to this month</p>
            </div>
            <Switch checked={rollover} onCheckedChange={setRollover} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
