"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { useGoals, useInvalidate } from "@/lib/queries";

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Savings goals</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && goals?.length === 0 && (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a target amount and date to start tracking a savings goal."
        />
      )}

      <div className="flex flex-col gap-3">
        {goals?.map((goal) => (
          <GoalCard key={goal._id} goal={goal} onChanged={() => invalidate.all()} />
        ))}
      </div>

      <GoalForm open={formOpen} onOpenChange={setFormOpen} onSaved={() => invalidate.all()} />
    </div>
  );
}
