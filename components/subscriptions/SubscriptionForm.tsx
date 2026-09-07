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
import { SUBSCRIPTION_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { toCents, fromCents, CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/utils/currency";
import type { SubscriptionDTO, BillingCycle } from "@/lib/types";
import { toast } from "sonner";

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function SubscriptionForm({
  subscription,
  open,
  onOpenChange,
  onSaved,
}: {
  subscription?: SubscriptionDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!subscription;

  const [name, setName] = useState(subscription?.name ?? "");
  const [amount, setAmount] = useState(subscription ? String(fromCents(subscription.amount)) : "");
  const [currency, setCurrency] = useState(subscription?.currency ?? DEFAULT_CURRENCY);
  const [exchangeRate, setExchangeRate] = useState(
    subscription?.exchangeRate ? String(subscription.exchangeRate) : "1"
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle ?? "monthly");
  const [billingDay, setBillingDay] = useState(subscription?.billingDay ? String(subscription.billingDay) : "1");
  const [icon, setIcon] = useState(subscription?.icon ?? "receipt");
  const [color, setColor] = useState(subscription?.color ?? "#A78BFA");
  const [saving, setSaving] = useState(false);

  const needsRate = currency !== "EGP";

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");

    let rate = 1;
    if (needsRate) {
      rate = Number(exchangeRate);
      if (!rate || rate <= 0) return toast.error(`Enter the ${currency} → EGP exchange rate`);
    }

    const day = Number(billingDay);
    if (!day || day < 1 || day > 31) return toast.error("Billing day must be 1-31");

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        amount: cents,
        currency,
        exchangeRate: rate,
        billingCycle,
        billingDay: day,
        icon,
        color,
      };
      if (isEdit) {
        await postJSON(`/api/subscriptions/${subscription._id}`, payload, "PATCH");
      } else {
        await postJSON("/api/subscriptions", payload);
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
          <DialogTitle>{isEdit ? "Edit subscription" : "Add subscription"}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-name">Name</Label>
            <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="sub-amount">Amount</Label>
              <Input
                id="sub-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="9.99"
              />
            </div>
            <div className="flex w-32 flex-col gap-1.5">
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
          </div>

          {needsRate && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-rate">Exchange rate (1 {currency} = ? EGP)</Label>
              <Input
                id="sub-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="e.g. 49.5"
              />
              <p className="text-xs text-muted-foreground">
                Used to convert this subscription into EGP for the total. Update it whenever the rate changes.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Billing cycle</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle((v as BillingCycle) ?? "monthly")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CYCLE_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sub-day">Billing day of month (1-31)</Label>
            <Input
              id="sub-day"
              type="number"
              min={1}
              max={31}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <IconPicker options={SUBSCRIPTION_ICON_OPTIONS} value={icon} onChange={setIcon} />
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
