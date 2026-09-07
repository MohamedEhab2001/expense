"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Archive } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import { monthlyEGPCost } from "@/lib/utils/subscriptions";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { postJSON } from "@/lib/fetcher";
import type { SubscriptionDTO } from "@/lib/types";
import { toast } from "sonner";

function dueLabel(billingDay: number, now = new Date()) {
  const daysUntil = billingDay - now.getDate();
  if (daysUntil === 0) return { label: "Renews today", className: "bg-warning/15 text-warning" };
  if (daysUntil < 0) return { label: `Renews day ${billingDay}`, className: "bg-secondary text-muted-foreground" };
  if (daysUntil <= 3) return { label: `Renews in ${daysUntil}d`, className: "bg-warning/15 text-warning" };
  return { label: `Renews day ${billingDay}`, className: "bg-secondary text-muted-foreground" };
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onChanged,
}: {
  subscription: SubscriptionDTO;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [togglingActive, setTogglingActive] = useState(false);
  const Icon = getIcon(subscription.icon);
  const isActive = subscription.isActive;
  const due = dueLabel(subscription.billingDay);
  const isForeign = subscription.currency !== "EGP";
  const egpCost = monthlyEGPCost(subscription);

  async function archive() {
    try {
      await postJSON(`/api/subscriptions/${subscription._id}`, {}, "DELETE");
      toast.success("Cancelled");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleActive(checked: boolean) {
    setTogglingActive(true);
    try {
      await postJSON(`/api/subscriptions/${subscription._id}`, { isActive: checked }, "PATCH");
      toast.success(checked ? "Resumed" : "Paused");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTogglingActive(false);
    }
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-transform active:scale-[0.99] ${
        isActive ? "" : "opacity-60"
      }`}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${subscription.color}26`, color: subscription.color }}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{subscription.name}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatCents(subscription.amount, subscription.currency)} / {subscription.billingCycle === "yearly" ? "yr" : "mo"}
          {isActive && isForeign && (
            <>
              {" "}
              · <AnimatedCurrency cents={egpCost} currency="EGP" />/mo
            </>
          )}
        </p>
      </div>

      {isActive ? (
        <Badge variant="outline" className={`border-transparent ${due.className}`}>
          {due.label}
        </Badge>
      ) : (
        <Badge variant="outline" className="border-transparent bg-secondary text-muted-foreground">
          Paused
        </Badge>
      )}

      <Switch
        checked={isActive}
        disabled={togglingActive}
        onCheckedChange={toggleActive}
        aria-label={isActive ? "Pause subscription" : "Resume subscription"}
      />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={archive}>
            <Archive className="size-4" /> Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
