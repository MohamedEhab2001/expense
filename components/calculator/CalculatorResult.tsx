import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { CalculatorResultDTO } from "@/lib/types";

const VERDICT_META: Record<
  CalculatorResultDTO["verdict"],
  { label: string; icon: typeof CheckCircle2; badge: string; border: string; color: string }
> = {
  go_for_it: {
    label: "Go for it",
    icon: CheckCircle2,
    badge: "bg-success/15 text-success",
    border: "border-l-success",
    color: "text-success",
  },
  doable_with_caution: {
    label: "Doable, with caution",
    icon: AlertTriangle,
    badge: "bg-warning/15 text-warning",
    border: "border-l-warning",
    color: "text-warning",
  },
  wait: {
    label: "Better to wait",
    icon: XCircle,
    badge: "bg-destructive/15 text-destructive",
    border: "border-l-destructive",
    color: "text-destructive",
  },
};

export function CalculatorResult({ result }: { result: CalculatorResultDTO }) {
  const meta = VERDICT_META[result.verdict];
  const Icon = meta.icon;

  const rows: { label: string; amount: number; emphasis?: boolean }[] = [
    { label: "Spendable balance (cash & bank)", amount: result.spendablePool },
    { label: "Planned spending this month", amount: -result.totalPlannedSpending },
    ...result.transferBreakdown,
  ];
  rows.push({ label: "This purchase", amount: -result.purchaseAmount });
  rows.push({ label: "Left over", amount: result.finalSpendable, emphasis: true });

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-center gap-3 rounded-xl border border-l-4 border-border bg-card p-4", meta.border)}>
        <Icon className={cn("size-5 shrink-0", meta.color)} />
        <div className="flex-1">
          <Badge className={cn(meta.badge)}>{meta.label}</Badge>
          {result.ai && <p className="mt-1.5 text-sm font-medium">{result.ai.headline}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs text-muted-foreground">Breakdown</p>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between text-sm",
                row.emphasis && "border-t border-border pt-2 font-semibold"
              )}
            >
              <span className={row.emphasis ? "" : "text-muted-foreground"}>{row.label}</span>
              <span className={cn("tabular-nums", row.amount < 0 && "text-destructive")}>
                {row.amount >= 0 ? "+" : "−"}
                {formatCents(Math.abs(row.amount), result.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {result.ai && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{result.ai.reasoning}</p>
          {result.ai.tips.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {result.ai.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
