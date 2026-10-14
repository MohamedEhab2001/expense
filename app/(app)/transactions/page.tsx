"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { CheckCheck, Receipt, SlidersHorizontal, X } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionFilterSheet } from "@/components/transactions/TransactionFilterSheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTransactions, useInvalidate } from "@/lib/queries";
import { formatCents } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { TransactionDTO, TransactionFilters } from "@/lib/types";
import { toast } from "sonner";

function groupLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function pluralize(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: transactions, isLoading } = useTransactions(100, filters);
  const invalidate = useInvalidate();

  const selectionMode = selectedIds.size > 0;
  const allTx = transactions ?? [];
  const allSelected = selectionMode && selectedIds.size === allTx.length;

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === allTx.length ? new Set() : new Set(allTx.map((tx) => tx._id))
    );
  }

  const selected = allTx.filter((tx) => selectedIds.has(tx._id));
  // Transfers and ATM withdrawals just move money between own accounts,
  // so they don't affect the net sum of the selection.
  const sumCents = selected.reduce(
    (sum, tx) =>
      sum + (tx.type === "expense" ? -tx.amount : tx.type === "income" ? tx.amount : 0),
    0
  );
  const expenseCount = selected.filter((tx) => tx.type === "expense").length;
  const incomeCount = selected.filter((tx) => tx.type === "income").length;
  const transferCount = selected.length - expenseCount - incomeCount;
  const breakdown = [
    expenseCount > 0 && pluralize(expenseCount, "expense"),
    incomeCount > 0 && pluralize(incomeCount, "income"),
    transferCount > 0 && pluralize(transferCount, "transfer"),
  ]
    .filter(Boolean)
    .join(" · ");

  const groups = allTx.reduce<Record<string, TransactionDTO[]>>((acc, tx) => {
    const label = groupLabel(tx.date);
    (acc[label] ??= []).push(tx);
    return acc;
  }, {});

  return (
    <div className={cn("flex flex-col gap-4 px-4 pt-6", selectionMode && "pb-16")}>
      {selectionMode ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="size-4" />
            </Button>
            <h1 className="text-xl font-semibold">{selectedIds.size} selected</h1>
          </div>
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            <CheckCheck className="size-4" /> {allSelected ? "Deselect all" : "Select all"}
          </Button>
        </div>
      ) : (
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
      )}

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && allTx.length === 0 && activeFilterCount === 0 && (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Tap the + button to log your first expense, income, transfer, or ATM withdrawal."
        />
      )}

      {!isLoading && allTx.length === 0 && activeFilterCount > 0 && (
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
                  <TransactionRow
                    transaction={tx}
                    onDelete={() => remove(tx._id)}
                    onChanged={() => invalidate.all()}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(tx._id)}
                    onSelect={toggleSelect}
                  />
                </StaggerItem>
              ))}
            </div>
            <Separator className="mt-2" />
          </div>
        ));
      })()}

      {selectionMode && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Sum of selected</p>
              <p
                className={
                  "tabular-nums text-lg font-semibold " +
                  (sumCents < 0 ? "text-destructive" : sumCents > 0 ? "text-success" : "text-foreground")
                }
              >
                {formatCents(sumCents)}
              </p>
            </div>
            {breakdown && <p className="shrink-0 text-right text-xs text-muted-foreground">{breakdown}</p>}
          </div>
        </motion.div>
      )}

      <TransactionFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
    </div>
  );
}
