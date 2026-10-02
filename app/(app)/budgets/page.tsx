"use client";

import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { BudgetSummaryCard } from "@/components/budgets/BudgetSummaryCard";
import { BudgetDetailSheet } from "@/components/budgets/BudgetDetailSheet";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useBudgets, useCategories, useInvalidate } from "@/lib/queries";
import type { BudgetStatusDTO } from "@/lib/types";

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  const { data: categories } = useCategories();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatusDTO | undefined>(undefined);
  const [viewingId, setViewingId] = useState<string | undefined>(undefined);

  const budgets = data?.budgets ?? [];
  // Read the open budget from fresh data so the sheet updates after edits.
  const viewing = budgets.find((b) => b._id === viewingId);

  // Subcategory budgets nest under their parent's budget when the parent has one.
  const topLevel = budgets
    .filter((b) => b.countsTowardTotal)
    .sort((a, b) => b.percentUsed - a.percentUsed);
  const nestedUnder = (parentId: string) =>
    budgets.filter((b) => !b.countsTowardTotal && b.category.parentId === parentId);

  function openForm(budget?: BudgetStatusDTO) {
    setEditing(budget);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budgets</h1>
        {data && data.unbudgetedCategories.length > 0 && (
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="size-4" /> Add
          </Button>
        )}
      </div>

      {!isLoading && data && budgets.length > 0 && <BudgetSummaryCard budgets={budgets} period={data.period} />}

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && budgets.length === 0 && (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set"
          description="Set a monthly budget per category — or per parent category to cover all its subcategories."
        />
      )}

      <div className="flex flex-col gap-2">
        {topLevel.map((b, i) => {
          const nested = nestedUnder(b.category._id);
          return (
            <StaggerItem key={b._id} index={i}>
              <button onClick={() => setViewingId(b._id)} className="w-full text-left transition-transform active:scale-[0.99]">
                <BudgetProgressBar budget={b} elapsedFraction={data?.period.elapsedFraction} />
              </button>
              {nested.length > 0 && (
                <div className="ml-4 mt-1.5 flex flex-col gap-1.5 border-l border-border pl-3">
                  {nested.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => setViewingId(n._id)}
                      className="w-full text-left transition-transform active:scale-[0.99]"
                    >
                      <BudgetProgressBar budget={n} elapsedFraction={data?.period.elapsedFraction} compact />
                    </button>
                  ))}
                </div>
              )}
            </StaggerItem>
          );
        })}
      </div>

      {viewing && data && (
        <BudgetDetailSheet
          key={viewing._id}
          budget={viewing}
          period={data.period}
          open
          onOpenChange={(open) => !open && setViewingId(undefined)}
          onEdit={() => {
            setViewingId(undefined);
            openForm(viewing);
          }}
        />
      )}

      <BudgetForm
        key={editing?._id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        unbudgetedCategories={data?.unbudgetedCategories ?? []}
        allCategories={categories ?? []}
        editingBudget={editing}
        onSaved={() => invalidate.all()}
      />
    </div>
  );
}
