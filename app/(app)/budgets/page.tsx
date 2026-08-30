import { PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function BudgetsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Budgets</h1>
      <EmptyState
        icon={PiggyBank}
        title="No budgets set"
        description="Set a monthly budget per category once categories are in place."
      />
    </div>
  );
}
