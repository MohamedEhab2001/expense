"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Archive, Check } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
import { formatCents, toCents } from "@/lib/utils/currency";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { postJSON } from "@/lib/fetcher";
import type { DebtDTO } from "@/lib/types";
import { toast } from "sonner";

const TYPE_LABELS = {
  installment: "Installment",
  debt: "Debt",
  credit_card: "Credit Card",
};

function statusInfo(debt: DebtDTO) {
  const isOneTime = debt.paymentSchedule === "one_time";
  switch (debt.status) {
    case "paid_off":
      return { label: "Paid off", className: "bg-secondary text-muted-foreground" };
    case "paid":
      return { label: "Paid this month", className: "bg-success/15 text-success" };
    case "overdue":
      return { label: "Overdue", className: "bg-destructive/15 text-destructive" };
    case "due_soon":
      return { label: `Due day ${debt.dueDay}`, className: "bg-warning/15 text-warning" };
    default:
      return isOneTime
        ? { label: "Unpaid", className: "bg-secondary text-muted-foreground" }
        : { label: `Due day ${debt.dueDay}`, className: "bg-secondary text-muted-foreground" };
  }
}

export function DebtCard({
  debt,
  onEdit,
  onChanged,
}: {
  debt: DebtDTO;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [payingAmount, setPayingAmount] = useState(false);
  const [amount, setAmount] = useState("");
  const Icon = getIcon(debt.icon);
  const isOneTime = debt.paymentSchedule === "one_time";
  const status = statusInfo(debt);
  const progress =
    debt.totalAmount && debt.totalAmount > 0
      ? Math.min(100, Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100))
      : null;
  const canPay = debt.status !== "paid" && debt.status !== "paid_off";

  async function archive() {
    try {
      await postJSON(`/api/debts/${debt._id}`, {}, "DELETE");
      toast.success("Archived");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function markPaid() {
    setPaying(true);
    try {
      await postJSON(`/api/debts/${debt._id}/pay`, {}, "POST");
      toast.success("Marked as paid");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  }

  async function payAmount() {
    const cents = toCents(Number(amount));
    if (!cents || cents <= 0) return toast.error("Enter a valid amount");
    setPaying(true);
    try {
      await postJSON(`/api/debts/${debt._id}/pay`, { amount: cents }, "POST");
      toast.success("Payment recorded");
      setPayingAmount(false);
      setAmount("");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${debt.color}26`, color: debt.color }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{debt.name}</p>
          <p className="text-xs text-muted-foreground">
            {TYPE_LABELS[debt.type]}
            {isOneTime
              ? " · pay whenever"
              : debt.monthlyPayment
                ? ` · ${formatCents(debt.monthlyPayment, debt.currency)}/mo`
                : ""}
            {debt.linkedAccountId ? ` · from ${debt.linkedAccountId.name}` : ""}
          </p>
        </div>
        <Badge variant="outline" className={`border-transparent ${status.className}`}>
          {status.label}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={archive}>
              <Archive className="size-4" /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {progress !== null && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            <AnimatedCurrency cents={debt.remainingAmount} currency={debt.currency} /> left of{" "}
            {formatCents(debt.totalAmount!, debt.currency)}
          </p>
        </div>
      )}
      {progress === null && (
        <p className="text-xs tabular-nums text-muted-foreground">
          <AnimatedCurrency cents={debt.remainingAmount} currency={debt.currency} /> balance
        </p>
      )}

      {canPay && isOneTime && (
        payingAmount ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              type="number"
              inputMode="decimal"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={payAmount} disabled={paying}>
              {paying ? "Paying..." : "Pay"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setPayingAmount(true)}>
            <Check className="size-4" /> Make a payment
          </Button>
        )
      )}

      {canPay && !isOneTime && (
        <Button size="sm" variant="outline" onClick={markPaid} disabled={paying}>
          <Check className="size-4" /> {paying ? "Marking..." : "Mark this month paid"}
        </Button>
      )}
    </div>
  );
}
