import { format } from "date-fns";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { budgetHealth, HEALTH_META, type BudgetHealth } from "@/components/budgets/budgetStatus";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { BudgetPeriodDTO, BudgetStatusDTO } from "@/lib/types";

const RING_SIZE = 96;
const STROKE = 9;

const RING_COLOR: Record<BudgetHealth, string> = {
  on_track: "var(--success)",
  watch: "var(--warning)",
  over: "var(--destructive)",
};

function Ring({ used, pace, health }: { used: number; pace: number; health: BudgetHealth }) {
  const r = (RING_SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.min(1, used) * c;
  // Tick on the ring where spending "should" be by today.
  const paceAngle = pace * 2 * Math.PI - Math.PI / 2;
  const center = RING_SIZE / 2;
  const inner = r - STROKE / 2 - 2;
  const outer = r + STROKE / 2 + 2;

  return (
    <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="var(--secondary)" strokeWidth={STROKE} />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={RING_COLOR[health]}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-700"
      />
      {pace > 0 && pace < 1 && (
        <line
          x1={center + inner * Math.cos(paceAngle)}
          y1={center + inner * Math.sin(paceAngle)}
          x2={center + outer * Math.cos(paceAngle)}
          y2={center + outer * Math.sin(paceAngle)}
          stroke="var(--foreground)"
          strokeOpacity={0.55}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
      <text x={center} y={center - 2} textAnchor="middle" className="fill-foreground text-lg font-semibold tabular-nums">
        {Math.round(used * 100)}%
      </text>
      <text x={center} y={center + 14} textAnchor="middle" className="fill-muted-foreground text-[10px]">
        used
      </text>
    </svg>
  );
}

// Overall picture: how much of the month's budget is gone, how that compares with how much of
// the month is gone, and what's left to spend per day.
export function BudgetSummaryCard({ budgets, period }: { budgets: BudgetStatusDTO[]; period: BudgetPeriodDTO }) {
  const counted = budgets.filter((b) => b.countsTowardTotal);
  const totalBudgeted = counted.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = counted.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const used = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0;
  const health = budgetHealth({ spent: totalSpent, budgeted: totalBudgeted }, period.elapsedFraction);

  const { daysLeft } = period;
  const perDay = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;
  const expectedByNow = totalBudgeted * period.elapsedFraction;
  const paceDelta = totalSpent - expectedByNow;

  const counts = budgets.reduce<Record<BudgetHealth, number>>(
    (acc, b) => ({ ...acc, [budgetHealth(b, period.elapsedFraction)]: acc[budgetHealth(b, period.elapsedFraction)] + 1 }),
    { on_track: 0, watch: 0, over: 0 }
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <Ring used={used} pace={period.elapsedFraction} health={health} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            Since {format(new Date(period.start), "MMM d")} · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            <AnimatedCurrency cents={Math.abs(remaining)} />
            <span className="ml-1 text-sm font-normal text-muted-foreground">{remaining < 0 ? "over" : "left"}</span>
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatCents(totalSpent)} spent of {formatCents(totalBudgeted)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-secondary/60 p-2.5">
          <p className="text-[11px] text-muted-foreground">Safe to spend / day</p>
          <p className="text-sm font-semibold tabular-nums">{formatCents(perDay)}</p>
        </div>
        <div className="rounded-lg bg-secondary/60 p-2.5">
          <p className="text-[11px] text-muted-foreground">{paceDelta > 0 ? "Ahead of pace by" : "Under pace by"}</p>
          <p className={cn("text-sm font-semibold tabular-nums", paceDelta > 0 ? "text-warning" : "text-success")}>
            {formatCents(Math.abs(paceDelta))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(counts) as BudgetHealth[])
          .filter((h) => counts[h] > 0)
          .map((h) => {
            const meta = HEALTH_META[h];
            return (
              <span key={h} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.bg, meta.text)}>
                <meta.icon className="size-3" />
                {counts[h]} {meta.label.toLowerCase()}
              </span>
            );
          })}
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-3 w-0.5 rounded-full bg-foreground/50" /> expected by today
        </span>
      </div>
    </div>
  );
}
