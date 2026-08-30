"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import { EmptyState } from "@/components/shared/EmptyState";
import { PieChart } from "lucide-react";
import type { CategoryBreakdownItemDTO } from "@/lib/types";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryBreakdownItemDTO }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">{formatCents(item.amount)}</p>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownItemDTO[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No spending this month"
        description="Log some expenses to see a category breakdown."
      />
    );
  }

  const chartHeight = Math.max(120, data.length * 36);

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--secondary)" }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
            ))}
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
