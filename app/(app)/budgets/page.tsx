"use client";

import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { formatCents } from "@/lib/utils/currency";
import { useBudgets, useInvalidate } from "@/lib/queries";
import type { BudgetStatusDTO } from "@/lib/types";

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatusDTO | undefined>(undefined);

  const totalBudgeted = data?.budgets.reduce((s, b) => s + b.budgeted, 0) ?? 0;
  const totalSpent = data?.budgets.reduce((s, b) => s + b.spent, 0) ?? 0;

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

      {!isLoading && data && data.budgets.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total spent this month</p>
          <p className="text-2xl font-semibold tabular-nums">
            <AnimatedCurrency cents={totalSpent} /> <span className="text-base font-normal text-muted-foreground">/ {formatCents(totalBudgeted)}</span>
          </p>
        </div>
      )}

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
        {data?.budgets.map((b, i) => (
          <StaggerItem key={b._id} index={i}>
            <button onClick={() => { setEditing(b); setFormOpen(true); }} className="w-full text-left transition-transform active:scale-[0.99]">
              <BudgetProgressBar budget={b} />
            </button>
          </StaggerItem>
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
