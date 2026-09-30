"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBreakdownChart } from "@/components/insights/CategoryBreakdownChart";
import { TrendChart } from "@/components/insights/TrendChart";
import { ExpensePeriodSummary } from "@/components/insights/ExpensePeriodSummary";
import { LocationBreakdownChart } from "@/components/insights/LocationBreakdownChart";
import { NetWorthChart } from "@/components/insights/NetWorthChart";
import { useAnalytics, useLocationBreakdown, useNetWorthTrend } from "@/lib/queries";

export default function InsightsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: locationData, isLoading: locationLoading } = useLocationBreakdown();
  const { data: netWorthData, isLoading: netWorthLoading } = useNetWorthTrend();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Insights</h1>

      <ExpensePeriodSummary />

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">This month by category</p>
        {analyticsLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <CategoryBreakdownChart data={analytics?.categoryBreakdown ?? []} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Income vs expense — last 6 months</p>
        {analyticsLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <TrendChart data={analytics?.trend ?? []} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Net worth — last 30 days</p>
        {netWorthLoading ? (
          <Skeleton className="h-44 w-full rounded-xl" />
        ) : (
          <NetWorthChart data={netWorthData ?? []} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Spending by location</p>
        {locationLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <LocationBreakdownChart data={locationData?.breakdown ?? []} />
        )}
      </section>

    </div>
  );
}
