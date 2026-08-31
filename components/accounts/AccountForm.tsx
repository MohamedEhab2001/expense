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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker, ColorPicker } from "@/components/shared/IconColorPicker";
import { ACCOUNT_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { toCents } from "@/lib/utils/currency";
import type { AccountDTO, AccountType } from "@/lib/types";
import { toast } from "sonner";

const TYPE_LABELS: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank account",
  credit_card: "Credit card",
  savings: "Savings",
  other: "Other",
};

export function AccountForm({
  account,
  open,
  onOpenChange,
  onSaved,
}: {
  account?: AccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!account;
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "bank");
  const [balance, setBalance] = useState(account ? String(account.balance / 100) : "0");
  const [owed, setOwed] = useState(account ? String(Math.max(0, -account.balance) / 100) : "0");
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit ? String(account.creditLimit / 100) : "");
  const [statementDay, setStatementDay] = useState(String(account?.statementDay ?? 25));
  const [icon, setIcon] = useState(account?.icon ?? "wallet");
  const [color, setColor] = useState(account?.color ?? "#34D399");
  const [saving, setSaving] = useState(false);

  const isCreditCard = type === "credit_card";

  async function submit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (isCreditCard) {
      const day = Number(statementDay);
      if (!day || day < 1 || day > 31) return toast.error("Statement day must be 1-31");
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: isCreditCard ? -toCents(Number(owed) || 0) : toCents(Number(balance) || 0),
        ...(isCreditCard
          ? {
              creditLimit: creditLimit ? toCents(Number(creditLimit)) : undefined,
              statementDay: Number(statementDay),
            }
          : {}),
        icon,
        color,
      };
      if (isEdit) {
        await postJSON(`/api/accounts/${account._id}`, payload, "PATCH");
      } else {
        await postJSON("/api/accounts", payload);
      }
      toast.success(isEdit ? "Account updated" : "Account added");
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
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-name">Name</Label>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash Wallet" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCreditCard ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-owed">Amount currently owed</Label>
                <Input
                  id="acc-owed"
                  type="number"
                  inputMode="decimal"
                  value={owed}
                  onChange={(e) => setOwed(e.target.value)}
                  placeholder="0 if you haven't spent on it yet"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-limit">Credit limit (optional)</Label>
                <Input
                  id="acc-limit"
                  type="number"
                  inputMode="decimal"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-statement-day">Statement / payment due day (1-31)</Label>
                <Input
                  id="acc-statement-day"
                  type="number"
                  min={1}
                  max={31}
                  value={statementDay}
                  onChange={(e) => setStatementDay(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acc-balance">{isEdit ? "Balance" : "Starting balance"}</Label>
              <Input
                id="acc-balance"
                type="number"
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <IconPicker options={ACCOUNT_ICON_OPTIONS} value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
