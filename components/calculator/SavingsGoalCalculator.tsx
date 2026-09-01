"use client";

import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { PartyPopper, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { getIcon } from "@/lib/icon-map";
import { useGoals } from "@/lib/queries";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY, formatCents, toCents } from "@/lib/utils/currency";

const MANUAL_GOAL = "__manual__";

export function SavingsGoalCalculator() {
  const { data: goals } = useGoals();
  const activeGoals = useMemo(() => (goals ?? []).filter((g) => !g.isArchived), [goals]);

  const [goalOverride, setGoalOverride] = useState<string | null>(null);
  const selectedGoalId =
    goalOverride && (goalOverride === MANUAL_GOAL || activeGoals.some((g) => g._id === goalOverride))
      ? goalOverride
      : activeGoals[0]?._id ?? MANUAL_GOAL;
  const selectedGoal = activeGoals.find((g) => g._id === selectedGoalId);

  const goalItems = useMemo(() => {
    const items: Record<string, string> = { [MANUAL_GOAL]: "Custom goal" };
    for (const g of activeGoals) items[g._id] = g.name;
    return items;
  }, [activeGoals]);

  const [manualName, setManualName] = useState("");
  const [manualTarget, setManualTarget] = useState("");
  const [manualCurrent, setManualCurrent] = useState("");
  const [manualCurrency, setManualCurrency] = useState(DEFAULT_CURRENCY as string);
  const currencyItems = useMemo(
    () => Object.fromEntries(CURRENCY_OPTIONS.map(({ code }) => [code, code])),
    []
  );

  const [monthlyContribution, setMonthlyContribution] = useState("");

  // Captured once per mount rather than called inline during render (Date.now()/new Date()
  // are impure) — good enough for a "months from today" estimate that doesn't need to track
  // the wall clock live.
  const now = useMemo(() => new Date(), []);

  const targetAmount = selectedGoal ? selectedGoal.targetAmount : toCents(Number(manualTarget) || 0);
  const currentAmount = selectedGoal ? selectedGoal.currentAmount : toCents(Number(manualCurrent) || 0);
  const currency = selectedGoal ? selectedGoal.currency : manualCurrency;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const contribution = toCents(Number(monthlyContribution) || 0);

  const monthsNeeded = contribution > 0 && remaining > 0 ? Math.ceil(remaining / contribution) : 0;
  const projectedDate = monthsNeeded > 0 ? addMonths(now, monthsNeeded) : null;
  const years = Math.floor(monthsNeeded / 12);
  const extraMonths = monthsNeeded % 12;

  let scheduleComparison: string | null = null;
  if (selectedGoal?.targetDate && monthsNeeded > 0) {
    const targetDate = new Date(selectedGoal.targetDate);
    const monthsUntilTargetDate = Math.max(
      1,
      Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const diff = monthsUntilTargetDate - monthsNeeded;
    if (diff > 0) {
      scheduleComparison = `That's ${diff} month${diff === 1 ? "" : "s"} ahead of this goal's ${format(targetDate, "MMM yyyy")} target.`;
    } else if (diff < 0) {
      const requiredMonthly = Math.ceil(remaining / monthsUntilTargetDate);
      scheduleComparison = `That's ${-diff} month${-diff === 1 ? "" : "s"} behind this goal's ${format(targetDate, "MMM yyyy")} target — you'd need ${formatCents(requiredMonthly, currency)}/month to hit that date instead.`;
    } else {
      scheduleComparison = `That lines up exactly with this goal's ${format(targetDate, "MMM yyyy")} target.`;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Goal</Label>
          <Select value={selectedGoalId} onValueChange={(v) => setGoalOverride(v ?? null)} items={goalItems}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MANUAL_GOAL}>Custom goal</SelectItem>
              {activeGoals.map((g) => (
                <SelectItem key={g._id} value={g._id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGoal ? (
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = getIcon(selectedGoal.icon);
              return (
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${selectedGoal.color}26`, color: selectedGoal.color }}
                >
                  <Icon className="size-4" />
                </div>
              );
            })()}
            <p className="text-sm text-muted-foreground">
              {formatCents(selectedGoal.currentAmount, selectedGoal.currency)} of{" "}
              {formatCents(selectedGoal.targetAmount, selectedGoal.currency)} saved
              {selectedGoal.targetDate ? ` · targeting ${format(new Date(selectedGoal.targetDate), "MMM yyyy")}` : ""}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-name">Name (optional)</Label>
              <Input id="goal-name" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="New car" />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="goal-target">Target amount</Label>
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-28 shrink-0">
                <Label>Currency</Label>
                <Select value={manualCurrency} onValueChange={(v) => setManualCurrency(v ?? DEFAULT_CURRENCY)} items={currencyItems}>
                  <SelectTrigger className="mt-1.5 w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(({ code }) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-current">Already saved (optional)</Label>
              <Input
                id="goal-current"
                type="number"
                inputMode="decimal"
                value={manualCurrent}
                onChange={(e) => setManualCurrent(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-contribution">How much can you save per month?</Label>
          <Input
            id="goal-contribution"
            type="number"
            inputMode="decimal"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {remaining <= 0 && targetAmount > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-l-4 border-border border-l-success bg-card p-4">
          <PartyPopper className="size-5 shrink-0 text-success" />
          <p className="text-sm font-medium">You&apos;ve already reached this goal!</p>
        </div>
      ) : contribution > 0 && targetAmount > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Time to reach {formatCents(targetAmount, currency)}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {monthsNeeded} month{monthsNeeded === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-muted-foreground">
            {years > 0 ? `${years} year${years === 1 ? "" : "s"}${extraMonths > 0 ? ` ${extraMonths} mo` : ""} · ` : ""}
            around {projectedDate ? format(projectedDate, "MMMM yyyy") : ""}
          </p>
          {scheduleComparison && <p className="mt-2 text-sm text-muted-foreground">{scheduleComparison}</p>}
        </div>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title="Enter a monthly amount"
          description="Pick or describe a goal and how much you can save per month to see when you'll get there."
        />
      )}
    </div>
  );
}
