import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Accounts</h1>
      <EmptyState
        icon={Wallet}
        title="No accounts yet"
        description="Add a cash wallet, bank account, or card to start tracking balances."
      />
    </div>
  );
}
