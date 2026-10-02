"use client";

import { Pencil, Receipt, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { postJSON } from "@/lib/fetcher";
import { formatCents } from "@/lib/utils/currency";
import { useInvalidate, useTransactions } from "@/lib/queries";
import type { BudgetPeriodDTO, BudgetStatusDTO } from "@/lib/types";
import { toast } from "sonner";

// A budget's breakdown and this period's transactions — for a parent, across all its subcategories.
export function BudgetDetailSheet({
  budget,
  period,
  open,
  onOpenChange,
  onEdit,
}: {
  budget: BudgetStatusDTO;
  period: BudgetPeriodDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const invalidate = useInvalidate();
  const { data: transactions, isLoading } = useTransactions(100, {
    categoryId: budget.category._id,
    type: "expense",
    from: period.start,
  });

  async function removeTransaction(id: string) {
    try {
      await postJSON(`/api/transactions/${id}`, {}, "DELETE");
      toast.success("Transaction deleted");
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function removeBudget() {
    try {
      await postJSON(`/api/budgets/${budget._id}`, {}, "DELETE");
      toast.success("Budget removed");
      onOpenChange(false);
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const breakdown = budget.breakdown?.slice().sort((a, b) => b.spent - a.spent) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{budget.category.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          <BudgetProgressBar budget={budget} elapsedFraction={period.elapsedFraction} />

          {breakdown.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">By subcategory</p>
              {breakdown.map((b) => {
                const share = budget.spent > 0 ? (b.spent / budget.spent) * 100 : 0;
                return (
                  <div key={b.category._id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ backgroundColor: b.category.color }} />
                        {b.category._id === budget.category._id ? `${b.category.name} (general)` : b.category.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCents(b.spent)} · {Math.round(share)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: b.category.color }} />
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <section className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Transactions this month</p>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !transactions?.length ? (
              <EmptyState icon={Receipt} title="Nothing spent yet" description="Expenses in this category will show up here." />
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <TransactionRow
                    key={tx._id}
                    transaction={tx}
                    onDelete={() => removeTransaction(tx._id)}
                    onChanged={() => invalidate.all()}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={removeBudget}>
              <Trash2 className="size-4" /> Remove budget
            </Button>
            <Button className="flex-1" onClick={onEdit}>
              <Pencil className="size-4" /> Edit budget
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
