"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import { EmptyState } from "@/components/shared/EmptyState";
import { MapPin } from "lucide-react";
import type { ExpenseBreakdownBarDTO } from "@/lib/types";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ExpenseBreakdownBarDTO }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{item.label}</p>
      <p className="tabular-nums text-muted-foreground">{formatCents(item.amount)}</p>
    </div>
  );
}

export function LocationBreakdownChart({ data }: { data: ExpenseBreakdownBarDTO[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No locations yet"
        description="Add a location to your expenses to see where you spend the most."
      />
    );
  }

  const top = data.slice(0, 8);
  const chartHeight = Math.max(120, top.length * 36);

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--secondary)" }} />
          <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16}>
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value?: unknown) => (typeof value === "number" ? formatCents(value) : "")}
              fill="var(--muted-foreground)"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
