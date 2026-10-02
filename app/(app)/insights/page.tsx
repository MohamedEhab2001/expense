"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBreakdownChart } from "@/components/insights/CategoryBreakdownChart";
import { TrendChart } from "@/components/insights/TrendChart";
import { ExpensePeriodSummary } from "@/components/insights/ExpensePeriodSummary";
import { LocationBreakdownChart } from "@/components/insights/LocationBreakdownChart";
import { NetWorthChart } from "@/components/insights/NetWorthChart";
import {
  useAnalytics,
  useCategories,
  useExpenseSummary,
  useLocationBreakdown,
  useNetWorthTrend,
} from "@/lib/queries";
import type { ExpensePeriod } from "@/lib/types";

export default function InsightsPage() {
  // The period picked in the summary scopes every section below it.
  const [period, setPeriod] = useState<ExpensePeriod>("month");
  const [dateKey, setDateKey] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const summary = useExpenseSummary(period, dateKey);
  const range = summary.data ? { from: summary.data.start, to: summary.data.end } : undefined;
  const rangeLabel = summary.data?.rangeLabel ?? "";

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(range);
  const { data: categories } = useCategories();
  const { data: locationData, isLoading: locationLoading } = useLocationBreakdown(range);
  const { data: netWorthData, isLoading: netWorthLoading } = useNetWorthTrend(range);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Insights</h1>

      <ExpensePeriodSummary
        period={period}
        onPeriodChange={setPeriod}
        onDateKeyChange={setDateKey}
        summary={summary}
      />

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">By category · {rangeLabel}</p>
        {!analytics || analyticsLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <CategoryBreakdownChart data={analytics.categoryBreakdown} categories={categories ?? []} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Income vs expense · 6 months to {rangeLabel}</p>
        {!analytics || analyticsLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <TrendChart data={analytics.trend} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Net worth · {rangeLabel}</p>
        {!netWorthData || netWorthLoading ? (
          <Skeleton className="h-44 w-full rounded-xl" />
        ) : (
          <NetWorthChart data={netWorthData} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Spending by location · {rangeLabel}</p>
        {!locationData || locationLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <LocationBreakdownChart data={locationData.breakdown} />
        )}
      </section>
    </div>
  );
}
