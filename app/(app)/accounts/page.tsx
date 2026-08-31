"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalancesByCurrency } from "@/components/shared/BalancesByCurrency";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountForm } from "@/components/accounts/AccountForm";
import { useAccounts, useInvalidate } from "@/lib/queries";
import { groupByCurrency } from "@/lib/utils/currency";
import type { AccountDTO } from "@/lib/types";
import { toast } from "sonner";

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountDTO | undefined>(undefined);

  const balancesByCurrency = accounts
    ? groupByCurrency(accounts, (a) => a.currency, (a) => a.balance)
    : [];

  async function archive(id: string) {
    try {
      await postJSON(`/api/accounts/${id}`, {}, "DELETE");
      toast.success("Account archived");
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && accounts && accounts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <BalancesByCurrency balances={balancesByCurrency} label="Total across accounts" />
        </div>
      )}

      {!isLoading && accounts?.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add a cash wallet, bank account, or card to start tracking balances."
        />
      )}

      <div className="flex flex-col gap-2">
        {accounts?.map((account, i) => (
          <StaggerItem key={account._id} index={i}>
            <AccountCard
              account={account}
              onEdit={() => {
                setEditing(account);
                setFormOpen(true);
              }}
              onArchive={() => archive(account._id)}
            />
          </StaggerItem>
        ))}
      </div>

      <AccountForm
        key={editing?._id ?? "new"}
        account={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => invalidate.all()}
      />
    </div>
  );
}
