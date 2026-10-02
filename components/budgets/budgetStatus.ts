import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import type { BudgetStatusDTO } from "@/lib/types";

export type BudgetHealth = "on_track" | "watch" | "over";

export const HEALTH_META: Record<BudgetHealth, { label: string; icon: LucideIcon; text: string; bg: string; fill: string }> = {
  on_track: { label: "On track", icon: CheckCircle2, text: "text-success", bg: "bg-success/12", fill: "bg-success" },
  watch: { label: "Watch", icon: AlertTriangle, text: "text-warning", bg: "bg-warning/15", fill: "bg-warning" },
  over: { label: "Over", icon: XCircle, text: "text-destructive", bg: "bg-destructive/12", fill: "bg-destructive" },
};

// Over once spending passes the budget; "watch" at 80%+ or when spending runs more than 10
// points ahead of how far through the month we are.
export function budgetHealth(
  { spent, budgeted }: Pick<BudgetStatusDTO, "spent" | "budgeted">,
  elapsedFraction?: number
): BudgetHealth {
  if (budgeted <= 0) return spent > 0 ? "over" : "on_track";
  const used = spent / budgeted;
  if (used > 1) return "over";
  if (used >= 0.8 || (elapsedFraction !== undefined && used > elapsedFraction + 0.1)) return "watch";
  return "on_track";
}
