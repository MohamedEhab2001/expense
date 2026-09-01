import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { AffordabilityChart } from "./AffordabilityChart";
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

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-center gap-3 rounded-xl border border-l-4 border-border bg-card p-4", meta.border)}>
        <Icon className={cn("size-5 shrink-0", meta.color)} />
        <div className="flex-1">
          <Badge className={cn(meta.badge)}>{meta.label}</Badge>
          {result.ai && <p className="mt-1.5 text-sm font-medium">{result.ai.headline}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Current balance" value={formatCents(result.currentBalance, result.currency)} />
        <Stat
          label="Lowest projected"
          value={formatCents(result.minProjectedBalance, result.currency)}
          negative={result.minProjectedBalance < 0}
        />
        <Stat
          label="Net monthly flow"
          value={formatCents(result.netMonthlyFlow, result.currency)}
          negative={result.netMonthlyFlow < 0}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs text-muted-foreground">Projected balance — with vs. without this purchase</p>
        <AffordabilityChart data={result.projection} currency={result.currency} />
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

function Stat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", negative && "text-destructive")}>{value}</p>
    </div>
  );
}
