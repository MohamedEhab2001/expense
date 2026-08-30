import { Target } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Savings goals</h1>
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Set a target amount and date to start tracking a savings goal."
      />
    </div>
  );
}
