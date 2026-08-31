"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";
import type { NetWorthPointDTO } from "@/lib/types";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      <p className="tabular-nums text-muted-foreground">{formatCents(payload[0].value)}</p>
    </div>
  );
}

export function NetWorthChart({ data }: { data: NetWorthPointDTO[] }) {
  if (data.length === 0) {
    return <EmptyState icon={TrendingUp} title="Not enough data" description="Keep logging to see your net worth trend." />;
  }

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={Math.ceil(data.length / 6)}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
