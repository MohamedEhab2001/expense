"use client";

import { format, parse } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PieChart } from "lucide-react";
import type { useExpenseSummary } from "@/lib/queries";
import type { ExpensePeriod } from "@/lib/types";

const PERIODS: { value: ExpensePeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

function shiftDate(period: ExpensePeriod, dateKey: string, direction: 1 | -1): string {
  const d = parse(dateKey, "yyyy-MM-dd", new Date());
  switch (period) {
    case "day":
      d.setDate(d.getDate() + direction);
      break;
    case "quarter":
      d.setMonth(d.getMonth() + direction * 3);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + direction);
      break;
  }
  return format(d, "yyyy-MM-dd");
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      <p className="tabular-nums text-muted-foreground">{formatCents(payload[0].value)}</p>
    </div>
  );
}

// Controlled by the Insights page, which scopes every other section to the period chosen here.
export function ExpensePeriodSummary({
  period,
  onPeriodChange,
  onDateKeyChange,
  summary,
}: {
  period: ExpensePeriod;
  onPeriodChange: (period: ExpensePeriod) => void;
  onDateKeyChange: (update: (dateKey: string) => string) => void;
  summary: ReturnType<typeof useExpenseSummary>;
}) {
  const { data, isLoading, isPlaceholderData } = summary;

  // Home months have irregular lengths, so step to the day just outside the shown range.
  function step(direction: 1 | -1) {
    if (isPlaceholderData) return; // the shown range is stale until the current one loads
    if (period === "month" && data) {
      // Period bounds are UTC-midnight days (like transaction dates), so read the day in UTC.
      const edge = direction === -1 ? new Date(data.start).getTime() - 1 : new Date(data.end).getTime() + 1;
      onDateKeyChange(() => new Date(edge).toISOString().slice(0, 10));
    } else {
      onDateKeyChange((d) => shiftDate(period, d, direction));
    }
  }

  const delta = data && data.previousTotal > 0 ? ((data.total - data.previousTotal) / data.previousTotal) * 100 : null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Total expenses</p>
        <div className="flex rounded-full border border-border p-0.5 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <button
          onClick={() => step(-1)}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs text-muted-foreground">{data?.rangeLabel ?? " "}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{formatCents(data?.total ?? 0)}</p>
          )}
          {delta !== null && (
            <p className={cn("text-xs tabular-nums", delta > 0 ? "text-destructive" : "text-success")}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(0)}% vs previous
            </p>
          )}
        </div>

        <button
          onClick={() => step(1)}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:bg-secondary"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !data || data.breakdown.length === 0 ? (
        <EmptyState icon={PieChart} title="No spending" description="No expenses logged in this period." />
      ) : (
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={data.breakdown} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                interval={data.breakdown.length > 15 ? Math.ceil(data.breakdown.length / 10) : 0}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {data.breakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color ?? "var(--destructive)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
