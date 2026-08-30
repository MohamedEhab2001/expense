"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { generateInsightAction } from "@/lib/actions/insights";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { InsightCard } from "@/components/insights/InsightCard";
import { CategoryBreakdownChart } from "@/components/insights/CategoryBreakdownChart";
import { TrendChart } from "@/components/insights/TrendChart";
import { useInsightsHistory, useInvalidate, useAnalytics } from "@/lib/queries";
import type { AIInsightDTO } from "@/lib/types";
import { toast } from "sonner";

export default function InsightsPage() {
  const { data: history, isLoading } = useInsightsHistory();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const invalidate = useInvalidate();
  const [pending, startTransition] = useTransition();
  const [latest, setLatest] = useState<AIInsightDTO | null>(null);

  const shown = latest ?? history?.[0];

  function generate() {
    startTransition(async () => {
      const result = await generateInsightAction();
      if (result.ok) {
        setLatest(result.insight);
        invalidate.insights();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Insights</h1>

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

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm font-medium text-muted-foreground">AI Insights</p>
        <Button size="sm" onClick={generate} disabled={pending}>
          <Sparkles className="size-4" /> {pending ? "Analyzing..." : "Generate"}
        </Button>
      </div>

      {pending && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {!pending && !isLoading && !shown && (
        <EmptyState
          icon={Sparkles}
          title="Not enough data yet"
          description="Log some transactions, then generate AI-powered insights about your spending and savings."
        />
      )}

      {!pending && shown && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Generated {format(new Date(shown.generatedAt), "MMM d, h:mm a")}
            </p>
            <p className="mt-1 text-sm">{shown.summary}</p>
          </div>
          {shown.insights.map((item, i) => (
            <InsightCard key={i} insight={item} />
          ))}
        </div>
      )}
    </div>
  );
}
