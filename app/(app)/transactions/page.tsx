"use client";

import { format, isToday, isYesterday } from "date-fns";
import { Receipt } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { EmptyState } from "@/components/shared/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions, useInvalidate } from "@/lib/queries";
import type { TransactionDTO } from "@/lib/types";
import { toast } from "sonner";

function groupLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions(100);
  const invalidate = useInvalidate();

  async function remove(id: string) {
    try {
      await postJSON(`/api/transactions/${id}`, {}, "DELETE");
      toast.success("Transaction deleted");
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const groups = (transactions ?? []).reduce<Record<string, TransactionDTO[]>>((acc, tx) => {
    const label = groupLabel(tx.date);
    (acc[label] ??= []).push(tx);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-xl font-semibold">Activity</h1>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && transactions?.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Tap the + button to log your first expense, income, transfer, or ATM withdrawal."
        />
      )}

      {Object.entries(groups).map(([label, txs]) => (
        <div key={label}>
          <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
          <div className="divide-y divide-border">
            {txs.map((tx) => (
              <TransactionRow key={tx._id} transaction={tx} onDelete={() => remove(tx._id)} />
            ))}
          </div>
          <Separator className="mt-2" />
        </div>
      ))}
    </div>
  );
}
