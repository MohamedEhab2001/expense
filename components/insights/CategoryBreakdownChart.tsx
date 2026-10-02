"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { CategoryBreakdownItemDTO, CategoryDTO } from "@/lib/types";

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

// Folds subcategory spending into its parent category, largest first.
function rollUpToParents(items: CategoryBreakdownItemDTO[], categories: CategoryDTO[]) {
  const byId = new Map(categories.map((c) => [c._id, c]));
  const totals = new Map<string, CategoryBreakdownItemDTO>();
  for (const item of items) {
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    const key = parent?._id ?? item.categoryId;
    const existing = totals.get(key);
    if (existing) existing.amount += item.amount;
    else
      totals.set(
        key,
        parent
          ? { categoryId: parent._id, parentId: null, name: parent.name, icon: parent.icon, color: parent.color, amount: item.amount }
          : { ...item }
      );
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export function CategoryBreakdownChart({
  data: items,
  categories,
}: {
  data: CategoryBreakdownItemDTO[];
  categories: CategoryDTO[];
}) {
  const [grouped, setGrouped] = useState(true);
  const hasSubcategories = items.some((i) => i.parentId);
  const data = grouped && hasSubcategories ? rollUpToParents(items, categories) : items;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No spending in this period"
        description="Log some expenses to see a category breakdown."
      />
    );
  }

  const chartHeight = Math.max(120, data.length * 36);

  return (
    <div className="flex flex-col gap-2">
      {hasSubcategories && (
        <div className="flex self-end rounded-full border border-border p-0.5 text-xs">
          {[
            { value: true, label: "Groups" },
            { value: false, label: "Subcategories" },
          ].map((o) => (
            <button
              key={o.label}
              onClick={() => setGrouped(o.value)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                grouped === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
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
    </div>
  );
}
