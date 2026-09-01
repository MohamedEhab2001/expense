"use client";

import { useState, useTransition } from "react";
import { Calculator } from "lucide-react";
import { runCalculatorAction } from "@/lib/actions/calculator";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorResult } from "@/components/calculator/CalculatorResult";
import { SavingsGoalCalculator } from "@/components/calculator/SavingsGoalCalculator";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { CalculatorInputDTO, CalculatorResultDTO } from "@/lib/types";
import { toast } from "sonner";

export default function CalculatorPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CalculatorResultDTO | null>(null);

  function handleSubmit(values: CalculatorInputDTO) {
    startTransition(async () => {
      const response = await runCalculatorAction(values);
      if (response.ok) {
        setResult(response.result);
      } else {
        toast.error(response.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div>
        <h1 className="text-xl font-semibold">Smart Calculator</h1>
        <p className="text-sm text-muted-foreground">Plan a purchase or a savings goal against your real finances.</p>
      </div>

      <Tabs defaultValue="afford">
        <TabsList className="w-full">
          <TabsTrigger value="afford">Afford a purchase</TabsTrigger>
          <TabsTrigger value="goal">Reach a savings goal</TabsTrigger>
        </TabsList>

        <TabsContent value="afford" className="flex flex-col gap-4 pt-4">
          <CalculatorForm onSubmit={handleSubmit} submitting={pending} />

          {pending && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {!pending && !result && (
            <EmptyState
              icon={Calculator}
              title="Run a scenario"
              description="Enter something you're considering buying to see if it fits your finances."
            />
          )}

          {!pending && result && <CalculatorResult result={result} />}
        </TabsContent>

        <TabsContent value="goal" className="pt-4">
          <SavingsGoalCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
