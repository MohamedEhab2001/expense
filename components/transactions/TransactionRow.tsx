"use client";

import { useRef, useState } from "react";
import { ArrowLeftRight, Banknote, Check, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditLocationDialog } from "@/components/transactions/EditLocationDialog";
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";
import type { TransactionDTO } from "@/lib/types";

const LONG_PRESS_MS = 450;
// Cancel the long-press once the pointer moves farther than this (scrolling).
const LONG_PRESS_SLOP_PX = 10;

export function TransactionRow({
  transaction,
  onDelete,
  onChanged,
  selectionMode = false,
  selected = false,
  onSelect,
}: {
  transaction: TransactionDTO;
  onDelete: () => void;
  onChanged?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);
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

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressOrigin.current = null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!onSelect || e.button !== 0) return;
    longPressFired.current = false;
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      pressOrigin.current = null;
      longPressFired.current = true;
      navigator.vibrate?.(15);
      onSelect(transaction._id);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pressOrigin.current) return;
    const dx = e.clientX - pressOrigin.current.x;
    const dy = e.clientY - pressOrigin.current.y;
    if (dx * dx + dy * dy > LONG_PRESS_SLOP_PX * LONG_PRESS_SLOP_PX) cancelPress();
  }

  function handleClick() {
    if (longPressFired.current) {
      // The long-press already acted; swallow the trailing click.
      longPressFired.current = false;
      return;
    }
    if (selectionMode) {
      onSelect?.(transaction._id);
      return;
    }
    setEditOpen(true);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg py-2.5 transition-colors",
        selected ? "bg-primary/10" : "active:bg-secondary/40"
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => {
          // Mobile long-press otherwise opens the text-selection callout.
          if (pressOrigin.current || longPressFired.current) e.preventDefault();
        }}
        className="flex min-w-0 flex-1 select-none items-center gap-3 text-left"
      >
        {selected ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </div>
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}26`, color }}
          >
            <Icon className="size-4" />
          </div>
        )}
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
      </button>
      {!selectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocationOpen(true)}>
              <MapPin className="size-4" /> {locationLabel ? "Edit location" : "Set location"}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <EditLocationDialog
        transaction={transaction}
        open={locationOpen}
        onOpenChange={setLocationOpen}
        onSaved={() => onChanged?.()}
      />

      {/* Mounted only while open so the form re-reads the transaction each time. */}
      {editOpen && (
        <EditTransactionDialog
          transaction={transaction}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => onChanged?.()}
        />
      )}
    </div>
  );
}
