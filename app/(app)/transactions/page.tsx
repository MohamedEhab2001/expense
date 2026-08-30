"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Receipt, SlidersHorizontal } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionFilterSheet } from "@/components/transactions/TransactionFilterSheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTransactions, useInvalidate } from "@/lib/queries";
import type { TransactionDTO, TransactionFilters } from "@/lib/types";
import { toast } from "sonner";

function groupLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const { data: transactions, isLoading } = useTransactions(100, filters);
  const invalidate = useInvalidate();

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Activity</h1>
        <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="relative">
          <SlidersHorizontal className="size-4" /> Filter
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && transactions?.length === 0 && activeFilterCount === 0 && (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Tap the + button to log your first expense, income, transfer, or ATM withdrawal."
        />
      )}

      {!isLoading && transactions?.length === 0 && activeFilterCount > 0 && (
        <EmptyState
          icon={Receipt}
          title="No matching transactions"
          description="Try adjusting or clearing your filters."
        />
      )}

      {(() => {
        let idx = 0;
        return Object.entries(groups).map(([label, txs]) => (
          <div key={label}>
            <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
            <div className="divide-y divide-border">
              {txs.map((tx) => (
                <StaggerItem key={tx._id} index={idx++}>
                  <TransactionRow transaction={tx} onDelete={() => remove(tx._id)} />
                </StaggerItem>
              ))}
            </div>
            <Separator className="mt-2" />
          </div>
        ));
      })()}

      <TransactionFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
    </div>
  );
}
