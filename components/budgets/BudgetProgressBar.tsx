import { DynamicIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { budgetHealth, HEALTH_META } from "@/components/budgets/budgetStatus";
import type { BudgetStatusDTO } from "@/lib/types";

const MAX_LEGEND = 3;

export function BudgetProgressBar({
  budget,
  elapsedFraction,
  compact = false,
}: {
  budget: BudgetStatusDTO;
  /** How far through the period today is (0–1); draws a "where you should be" marker. */
  elapsedFraction?: number;
  /** Smaller variant for subcategory budgets nested under their parent. */
  compact?: boolean;
}) {
  const health = budgetHealth(budget, elapsedFraction);
  const meta = HEALTH_META[health];
  const remaining = budget.budgeted - budget.spent;

  // The bar spans whichever is larger, the budget or the spending, so an overrun shows as the
  // part of the bar past the limit line rather than being clipped at 100%.
  const scale = Math.max(budget.budgeted, budget.spent, 1);
  const pct = (cents: number) => (cents / scale) * 100;
  const limitPct = pct(budget.budgeted);
  const pacePct = elapsedFraction !== undefined && budget.budgeted > 0 ? limitPct * elapsedFraction : undefined;

  // Groups split the bar by subcategory; single categories use one status-colored fill.
  const segments =
    budget.isGroup && budget.breakdown
      ? budget.breakdown.filter((b) => b.spent > 0).sort((a, b) => b.spent - a.spent)
      : null;

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card", compact ? "p-2.5" : "p-3")}>
      <div className="flex items-center gap-2">
        <div
          className={cn("flex shrink-0 items-center justify-center rounded-full", compact ? "size-6" : "size-8")}
          style={{ backgroundColor: `${budget.category.color}26`, color: budget.category.color }}
        >
          <DynamicIcon name={budget.category.icon ?? "tag"} className={compact ? "size-3" : "size-4"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", compact ? "text-xs" : "text-sm")}>
            {budget.category.name}
            {budget.isGroup && <span className="ml-1.5 text-xs font-normal text-muted-foreground">group</span>}
          </p>
          {!compact && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatCents(budget.spent)} of {formatCents(budget.budgeted)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className={cn("text-sm font-semibold tabular-nums", remaining < 0 && "text-destructive")}>
            {formatCents(Math.abs(remaining))}
          </span>
          <span className="text-[11px] text-muted-foreground">{remaining < 0 ? "over" : "left"}</span>
        </div>
      </div>

      <div className="relative">
        <div className={cn("flex w-full gap-0.5 overflow-hidden rounded-full bg-secondary", compact ? "h-1.5" : "h-2.5")}>
          {segments
            ? segments.map((s) => (
                <div
                  key={s.category._id}
                  className="h-full shrink-0 transition-all first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${pct(s.spent)}%`, backgroundColor: s.category.color }}
                />
              ))
            : budget.spent > 0 && (
                <div
                  className={cn("h-full rounded-full transition-all", meta.fill)}
                  style={{ width: `${pct(budget.spent)}%` }}
                />
              )}
        </div>
        {budget.spent > budget.budgeted && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
            style={{ left: `calc(${limitPct}% - 1px)` }}
            title="Budget limit"
          />
        )}
        {pacePct !== undefined && pacePct > 0 && pacePct < 100 && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground/50"
            style={{ left: `calc(${pacePct}% - 1px)` }}
            title="Expected spending by today"
          />
        )}
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2">
          {segments && segments.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {segments.slice(0, MAX_LEGEND).map((s) => (
                <span key={s.category._id} className="flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.category.color }} />
                  {s.category.name}
                </span>
              ))}
              {segments.length > MAX_LEGEND && <span>+{segments.length - MAX_LEGEND} more</span>}
            </div>
          ) : (
            <span className="text-[11px] tabular-nums text-muted-foreground">{budget.percentUsed}% used</span>
          )}
          <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.bg, meta.text)}>
            <meta.icon className="size-3" />
            {meta.label}
          </span>
        </div>
      )}
    </div>
  );
}
