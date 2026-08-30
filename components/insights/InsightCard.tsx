import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { InsightItemDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<InsightItemDTO["severity"], { border: string; icon: typeof Info; color: string }> = {
  info: { border: "border-l-primary", icon: Info, color: "text-primary" },
  warning: { border: "border-l-warning", icon: AlertTriangle, color: "text-warning" },
  positive: { border: "border-l-success", icon: CheckCircle2, color: "text-success" },
};

export function InsightCard({ insight }: { insight: InsightItemDTO }) {
  const style = SEVERITY_STYLES[insight.severity];
  const Icon = style.icon;

  return (
    <div className={cn("flex gap-3 rounded-xl border border-l-4 border-border bg-card p-4", style.border)}>
      <Icon className={cn("size-4 shrink-0 translate-y-0.5", style.color)} />
      <div>
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{insight.body}</p>
      </div>
    </div>
  );
}
