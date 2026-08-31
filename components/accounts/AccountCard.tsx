"use client";

import { MoreVertical, Pencil, Archive } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AccountDTO } from "@/lib/types";

export function AccountCard({
  account,
  onEdit,
  onArchive,
}: {
  account: AccountDTO;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const Icon = getIcon(account.icon);
  const isCreditCard = account.type === "credit_card";
  const owed = isCreditCard ? Math.max(0, -account.balance) : 0;
  const hasLimit = isCreditCard && !!account.creditLimit;
  const usagePct = hasLimit ? Math.min(100, Math.round((owed / account.creditLimit!) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${account.color}26`, color: account.color }}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{account.name}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {isCreditCard ? `Due day ${account.statementDay ?? 25}` : account.type.replace("_", " ")}
          </p>
        </div>
        {!isCreditCard && (
          <p className="tabular-nums font-semibold">
            <AnimatedCurrency cents={account.balance} currency={account.currency} />
          </p>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onArchive}>
              <Archive className="size-4" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isCreditCard && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
            <span className={owed > 0 ? "font-medium text-destructive" : ""}>
              <AnimatedCurrency cents={owed} currency={account.currency} /> owed
            </span>
            {hasLimit && (
              <span>
                <AnimatedCurrency cents={account.creditLimit! - owed} currency={account.currency} /> available
              </span>
            )}
          </div>
          {hasLimit && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-destructive" : usagePct >= 70 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
