import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">AI Insights</h1>
      <EmptyState
        icon={Sparkles}
        title="Not enough data yet"
        description="Once you've logged some transactions, generate AI-powered insights about your spending and savings."
      />
    </div>
  );
}
