"use client";

import { useState } from "react";
import { format } from "date-fns";
import { getIcon } from "@/lib/icon-map";
import { formatCents, toCents } from "@/lib/utils/currency";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { GoalProgressRing } from "./GoalProgressRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJSON } from "@/lib/fetcher";
import type { GoalDTO } from "@/lib/types";
import { toast } from "sonner";

export function GoalCard({ goal, onChanged }: { goal: GoalDTO; onChanged: () => void }) {
  const [contributing, setContributing] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const Icon = getIcon(goal.icon);
  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  async function contribute() {
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      await postJSON(`/api/goals/${goal._id}/contribute`, { amount: cents });
      toast.success("Contribution added");
      setContributing(false);
      setAmount("");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${goal.color}26`, color: goal.color }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            <AnimatedCurrency cents={goal.currentAmount} /> of {formatCents(goal.targetAmount)}
            {goal.targetDate ? ` · by ${format(new Date(goal.targetDate), "MMM d, yyyy")}` : ""}
            {goal.linkedAccountId ? ` · linked to ${goal.linkedAccountId.name}` : ""}
          </p>
        </div>
        <GoalProgressRing percent={percent} />
      </div>

      {!goal.linkedAccountId && (
        <div>
          {contributing ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={contribute} disabled={saving}>
                Add
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setContributing(true)}>
              Add contribution
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
