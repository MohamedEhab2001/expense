import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Activity</h1>
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Tap the + button to log your first expense, income, transfer, or ATM withdrawal."
      />
    </div>
  );
}
