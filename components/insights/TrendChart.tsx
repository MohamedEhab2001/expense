"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import type { MonthlyTrendItemDTO } from "@/lib/types";

const INCOME_COLOR = "var(--success)";
const EXPENSE_COLOR = "var(--destructive)";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatCents(p.value)}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: MonthlyTrendItemDTO[] }) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--secondary)" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} barSize={12} />
          <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
