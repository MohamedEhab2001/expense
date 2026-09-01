"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatCents } from "@/lib/utils/currency";
import type { CalculatorProjectionPointDTO } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const withPurchase = payload.find((p) => p.dataKey === "withPurchase")?.value;
  const baseline = payload.find((p) => p.dataKey === "baseline")?.value;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {baseline !== undefined && (
        <p className="tabular-nums text-muted-foreground">Without: {formatCents(baseline, currency)}</p>
      )}
      {withPurchase !== undefined && (
        <p className="tabular-nums text-primary">With: {formatCents(withPurchase, currency)}</p>
      )}
    </div>
  );
}

export function AffordabilityChart({
  data,
  currency,
}: {
  data: CalculatorProjectionPointDTO[];
  currency: string;
}) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: "var(--border)" }} />
          <ReferenceLine y={0} stroke="var(--destructive)" strokeOpacity={0.4} strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line type="monotone" dataKey="withPurchase" stroke="var(--primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
