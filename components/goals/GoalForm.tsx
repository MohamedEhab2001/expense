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
import { GOAL_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { useAccounts } from "@/lib/queries";
import { toCents, CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/utils/currency";
import type { GoalDTO } from "@/lib/types";
import { toast } from "sonner";

export function GoalForm({
  goal,
  open,
  onOpenChange,
  onSaved,
}: {
  goal?: GoalDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!goal;
  const { data: accounts } = useAccounts();
  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount / 100) : "");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ? goal.targetDate.slice(0, 10) : "");
  const [linkedAccountId, setLinkedAccountId] = useState<string>(goal?.linkedAccountId?._id ?? "none");
  const [currency, setCurrency] = useState(goal?.currency ?? DEFAULT_CURRENCY);
  const [icon, setIcon] = useState(goal?.icon ?? "target");
  const [color, setColor] = useState(goal?.color ?? "#34D399");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    const cents = toCents(Number(targetAmount));
    if (!cents || cents <= 0) return toast.error("Enter a valid target amount");

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: cents,
        targetDate: targetDate || undefined,
        currency,
        linkedAccountId: linkedAccountId === "none" ? undefined : linkedAccountId,
        icon,
        color,
      };
      if (isEdit) {
        await postJSON(`/api/goals/${goal._id}`, payload, "PATCH");
      } else {
        await postJSON("/api/goals", payload);
      }
      toast.success(isEdit ? "Goal updated" : "Goal created");
      onSaved();
      onOpenChange(false);
      if (!isEdit) {
        setName("");
        setTargetAmount("");
        setTargetDate("");
        setLinkedAccountId("none");
        setCurrency(DEFAULT_CURRENCY);
      }
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
          <DialogTitle>{isEdit ? "Edit savings goal" : "New savings goal"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency Fund" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-amount">Target amount</Label>
            <Input
              id="goal-amount"
              type="number"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Link to account (optional)</Label>
            <Select value={linkedAccountId} onValueChange={(v) => setLinkedAccountId(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — track manually</SelectItem>
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
            <IconPicker options={GOAL_ICON_OPTIONS} value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
