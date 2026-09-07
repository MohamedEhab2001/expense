"use client";

import { useState } from "react";
import { Plus, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaggerItem } from "@/components/shared/StaggerItem";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { monthlyEGPCost } from "@/lib/utils/subscriptions";
import { useSubscriptions, useInvalidate } from "@/lib/queries";
import type { SubscriptionDTO } from "@/lib/types";

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionDTO | undefined>(undefined);

  function refresh() {
    invalidate.subscriptions();
  }

  const totalMonthlyEGP = (subscriptions ?? []).reduce((sum, s) => sum + monthlyEGPCost(s), 0);
  const pausedCount = (subscriptions ?? []).filter((s) => !s.isActive).length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Subscriptions</h1>
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

      {!isLoading && subscriptions && subscriptions.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total per month</p>
          <p className="text-2xl font-semibold tabular-nums">
            <AnimatedCurrency cents={totalMonthlyEGP} currency="EGP" />
          </p>
          <p className="text-xs text-muted-foreground">
            Foreign-currency subscriptions are converted using the exchange rate you set on each one.
            {pausedCount > 0 &&
              ` ${pausedCount} paused subscription${pausedCount > 1 ? "s" : ""} ${pausedCount > 1 ? "aren't" : "isn't"} counted.`}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && subscriptions?.length === 0 && (
        <EmptyState
          icon={Tv}
          title="No subscriptions yet"
          description="Add a subscription to track its cost — set an exchange rate if it's billed in a foreign currency."
        />
      )}

      <div className="flex flex-col gap-3">
        {subscriptions?.map((sub, i) => (
          <StaggerItem key={sub._id} index={i}>
            <SubscriptionCard
              subscription={sub}
              onEdit={() => {
                setEditing(sub);
                setFormOpen(true);
              }}
              onChanged={refresh}
            />
          </StaggerItem>
        ))}
      </div>

      <SubscriptionForm
        key={editing?._id ?? "new"}
        subscription={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />
    </div>
  );
}
