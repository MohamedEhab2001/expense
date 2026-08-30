"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtForm } from "@/components/debts/DebtForm";
import { useDebts, useInvalidate } from "@/lib/queries";
import type { DebtDTO } from "@/lib/types";

export default function DebtsPage() {
  const { data: debts, isLoading } = useDebts();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DebtDTO | undefined>(undefined);

  function refresh() {
    invalidate.debts();
    invalidate.dashboard();
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Installments & Debts</h1>
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
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && debts?.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="Nothing tracked yet"
          description="Add a loan installment, personal debt, or credit card to track balances and due dates."
        />
      )}

      <div className="flex flex-col gap-3">
        {debts?.map((debt, i) => (
          <StaggerItem key={debt._id} index={i}>
            <DebtCard
              debt={debt}
              onEdit={() => {
                setEditing(debt);
                setFormOpen(true);
              }}
              onChanged={refresh}
            />
          </StaggerItem>
        ))}
      </div>

      <DebtForm
        key={editing?._id ?? "new"}
        debt={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />
    </div>
  );
}
