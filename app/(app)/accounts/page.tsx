"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Wallet } from "lucide-react";
import { fetcher, postJSON } from "@/lib/fetcher";
import { formatCents } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountForm } from "@/components/accounts/AccountForm";
import type { AccountDTO } from "@/lib/types";
import { toast } from "sonner";

export default function AccountsPage() {
  const { data: accounts, mutate, isLoading } = useSWR<AccountDTO[]>("/api/accounts", fetcher);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountDTO | undefined>(undefined);

  const total = accounts?.reduce((s, a) => s + a.balance, 0) ?? 0;

  async function archive(id: string) {
    try {
      await postJSON(`/api/accounts/${id}`, {}, "DELETE");
      toast.success("Account archived");
      mutate();
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

      {accounts && accounts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total across accounts</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCents(total)}</p>
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
        {accounts?.map((account) => (
          <AccountCard
            key={account._id}
            account={account}
            onEdit={() => {
              setEditing(account);
              setFormOpen(true);
            }}
            onArchive={() => archive(account._id)}
          />
        ))}
      </div>

      <AccountForm
        key={editing?._id ?? "new"}
        account={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => mutate()}
      />
    </div>
  );
}
