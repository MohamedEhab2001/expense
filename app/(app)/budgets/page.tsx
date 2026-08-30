"use client";

import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useBudgets, useInvalidate } from "@/lib/queries";
import type { BudgetStatusDTO } from "@/lib/types";

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatusDTO | undefined>(undefined);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budgets</h1>
        {data && data.unbudgetedCategories.length > 0 && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && data?.budgets.length === 0 && (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set"
          description="Set a monthly budget per category to track spending against a limit."
        />
      )}

      <div className="flex flex-col gap-2">
        {data?.budgets.map((b) => (
          <button key={b._id} onClick={() => { setEditing(b); setFormOpen(true); }} className="text-left">
            <BudgetProgressBar budget={b} />
          </button>
        ))}
      </div>

      <BudgetForm
        key={editing?._id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        unbudgetedCategories={data?.unbudgetedCategories ?? []}
        editingBudget={editing}
        onSaved={() => invalidate.all()}
      />
    </div>
  );
}
