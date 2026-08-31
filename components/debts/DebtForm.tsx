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
import { DEBT_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { toCents, CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/utils/currency";
import { useAccounts } from "@/lib/queries";
import type { DebtDTO, DebtType, DebtPaymentSchedule } from "@/lib/types";
import { toast } from "sonner";

const TYPE_OPTIONS: { value: DebtType; label: string }[] = [
  { value: "installment", label: "Installment (fixed loan)" },
  { value: "debt", label: "Personal debt" },
  { value: "credit_card", label: "Credit card" },
];

const SCHEDULE_OPTIONS: { value: DebtPaymentSchedule; label: string }[] = [
  { value: "monthly", label: "Monthly installments" },
  { value: "one_time", label: "Pay whenever (one-off)" },
];

export function DebtForm({
  debt,
  open,
  onOpenChange,
  onSaved,
}: {
  debt?: DebtDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!debt;
  const { data: accounts } = useAccounts();

  const [name, setName] = useState(debt?.name ?? "");
  const [type, setType] = useState<DebtType>(debt?.type ?? "installment");
  const [paymentSchedule, setPaymentSchedule] = useState<DebtPaymentSchedule>(debt?.paymentSchedule ?? "monthly");
  const [totalAmount, setTotalAmount] = useState(debt?.totalAmount ? String(debt.totalAmount / 100) : "");
  const [remainingAmount, setRemainingAmount] = useState(debt ? String(debt.remainingAmount / 100) : "");
  const [monthlyPayment, setMonthlyPayment] = useState(debt?.monthlyPayment ? String(debt.monthlyPayment / 100) : "");
  const [dueDay, setDueDay] = useState(debt?.dueDay ? String(debt.dueDay) : "1");
  const [linkedAccountId, setLinkedAccountId] = useState(debt?.linkedAccountId?._id ?? "none");
  const [currency, setCurrency] = useState(debt?.currency ?? DEFAULT_CURRENCY);
  const [icon, setIcon] = useState(debt?.icon ?? "credit-card");
  const [color, setColor] = useState(debt?.color ?? "#F87171");
  const [saving, setSaving] = useState(false);

  const isMonthly = paymentSchedule === "monthly";

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    const remaining = toCents(Number(remainingAmount));
    if (remainingAmount === "" || remaining < 0) return toast.error("Enter a valid remaining balance");

    let monthly: number | undefined;
    let day: number | undefined;
    if (isMonthly) {
      monthly = toCents(Number(monthlyPayment));
      day = Number(dueDay);
      if (!monthly || monthly <= 0) return toast.error("Enter a valid monthly payment");
      if (!day || day < 1 || day > 31) return toast.error("Due day must be 1-31");
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        paymentSchedule,
        totalAmount: totalAmount ? toCents(Number(totalAmount)) : undefined,
        remainingAmount: remaining,
        currency,
        monthlyPayment: monthly,
        dueDay: day,
        linkedAccountId: linkedAccountId === "none" ? undefined : linkedAccountId,
        icon,
        color,
      };
      if (isEdit) {
        await postJSON(`/api/debts/${debt._id}`, payload, "PATCH");
      } else {
        await postJSON("/api/debts", payload);
      }
      toast.success(isEdit ? "Updated" : "Added");
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
          <DialogTitle>{isEdit ? "Edit" : "Add installment or debt"}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-name">Name</Label>
            <Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Car loan" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType((v as DebtType) ?? "installment")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Payment type</Label>
            <Select
              value={paymentSchedule}
              onValueChange={(v) => setPaymentSchedule((v as DebtPaymentSchedule) ?? "monthly")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-total">Total amount (optional)</Label>
            <Input
              id="debt-total"
              type="number"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="Leave blank for credit cards"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-remaining">Remaining balance</Label>
            <Input
              id="debt-remaining"
              type="number"
              inputMode="decimal"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
            />
          </div>

          {isMonthly && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="debt-monthly">Monthly payment</Label>
                <Input
                  id="debt-monthly"
                  type="number"
                  inputMode="decimal"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="debt-due-day">Due day of month (1-31)</Label>
                <Input
                  id="debt-due-day"
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Pay from (optional)</Label>
            <Select value={linkedAccountId} onValueChange={(v) => setLinkedAccountId(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked</SelectItem>
                {accounts?.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {linkedAccountId === "none" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? DEFAULT_CURRENCY)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(({ code, label }) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Uses {accounts?.find((a) => a._id === linkedAccountId)?.name ?? "the linked account"}&apos;s currency.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <IconPicker options={DEBT_ICON_OPTIONS} value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
