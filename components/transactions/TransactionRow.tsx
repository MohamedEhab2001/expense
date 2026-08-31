"use client";

import { useState } from "react";
import { ArrowLeftRight, Banknote, MapPin, MoreVertical, Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditLocationDialog } from "@/components/transactions/EditLocationDialog";
import type { TransactionDTO } from "@/lib/types";

export function TransactionRow({
  transaction,
  onDelete,
  onChanged,
}: {
  transaction: TransactionDTO;
  onDelete: () => void;
  onChanged?: () => void;
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const isExpense = transaction.type === "expense";
  const isIncome = transaction.type === "income";
  const isMove = transaction.type === "transfer" || transaction.type === "atm_withdrawal";

  const Icon = isMove
    ? transaction.type === "atm_withdrawal"
      ? Banknote
      : ArrowLeftRight
    : getIcon(transaction.categoryId?.icon ?? "tag");

  const color = isMove ? "#60A5FA" : transaction.categoryId?.color ?? "#94A3B8";

  const title = isMove
    ? `${transaction.accountId.name} → ${transaction.linkedAccountId?.name}`
    : transaction.categoryId?.name ?? "Uncategorized";

  const subtitle = isMove
    ? transaction.type === "atm_withdrawal"
      ? "ATM withdrawal"
      : "Transfer"
    : transaction.accountId.name;

  const locationLabel = [transaction.location?.city, transaction.location?.governorate]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-3 rounded-lg py-2.5 transition-colors active:bg-secondary/40">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26`, color }}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle}
          {transaction.note ? ` · ${transaction.note}` : ""}
          {locationLabel ? ` · ${locationLabel}` : ""}
        </p>
      </div>
      <p
        className={
          "tabular-nums text-sm font-semibold " +
          (isExpense ? "text-destructive" : isIncome ? "text-success" : "text-foreground")
        }
      >
        {isExpense ? "-" : isIncome ? "+" : ""}
        {formatCents(transaction.amount)}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLocationOpen(true)}>
            <MapPin className="size-4" /> {locationLabel ? "Edit location" : "Set location"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditLocationDialog
        transaction={transaction}
        open={locationOpen}
        onOpenChange={setLocationOpen}
        onSaved={() => onChanged?.()}
      />
    </div>
  );
}
