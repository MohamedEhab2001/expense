import { getIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import type { BudgetStatusDTO } from "@/lib/types";

function barColor(percent: number) {
  if (percent >= 100) return "bg-destructive";
  if (percent >= 80) return "bg-warning";
  return "bg-success";
}

export function BudgetProgressBar({ budget }: { budget: BudgetStatusDTO }) {
  const Icon = getIcon(budget.category.icon ?? "tag");
  const pct = Math.min(100, budget.percentUsed);

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: `${budget.category.color}26`, color: budget.category.color }}
          >
            <Icon className="size-3.5" />
          </div>
          <span className="text-sm font-medium">{budget.category.name}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatCents(budget.spent)} / {formatCents(budget.budgeted)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full transition-all ${barColor(budget.percentUsed)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
