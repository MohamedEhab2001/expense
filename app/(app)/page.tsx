"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatCents } from "@/lib/utils/currency";
import { getIcon } from "@/lib/icon-map";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Skeleton } from "@/components/ui/skeleton";
import { postJSON } from "@/lib/fetcher";
import { useDashboardSummary, useInvalidate } from "@/lib/queries";
import { toast } from "sonner";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-40" />
      </header>
      <div className="flex gap-3">
        <Skeleton className="h-24 w-36 rounded-xl" />
        <Skeleton className="h-24 w-36 rounded-xl" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  const invalidate = useInvalidate();

  async function removeTransaction(id: string) {
    try {
      await postJSON(`/api/transactions/${id}`, {}, "DELETE");
      toast.success("Transaction deleted");
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data || data.accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-6">
        <header>
          <p className="text-sm text-muted-foreground">Total balance</p>
          <p className="text-3xl font-semibold tabular-nums">{formatCents(0)}</p>
        </header>
        <Link
          href="/accounts"
          className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        >
          No accounts yet. Tap here to add one and get started.
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">Total balance</p>
        <p className="text-3xl font-semibold tabular-nums">{formatCents(data.totalBalance)}</p>
      </header>

      {data.upcomingDebts.length > 0 && (
        <Link
          href="/debts"
          className="flex flex-col gap-2 rounded-xl border border-l-4 border-warning bg-card p-3"
        >
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="size-4" />
            <p className="text-sm font-medium">
              {data.upcomingDebts.length} payment{data.upcomingDebts.length > 1 ? "s" : ""} due
            </p>
          </div>
          {data.upcomingDebts.map((d) => (
            <p key={d._id} className="text-xs text-muted-foreground">
              <span className={d.status === "overdue" ? "font-medium text-destructive" : "font-medium text-warning"}>
                {d.status === "overdue" ? "Overdue" : `Due day ${d.dueDay}`}
              </span>{" "}
              — {d.name} · {formatCents(d.monthlyPayment)}
            </p>
          ))}
        </Link>
      )}

      {data.accounts.length > 0 && (
        <section className="flex gap-3 overflow-x-auto pb-1">
          {data.accounts.map((a) => {
            const Icon = getIcon(a.icon);
            return (
              <Link
                key={a._id}
                href="/accounts"
                className="flex min-w-[140px] flex-col gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className="flex size-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${a.color}26`, color: a.color }}
                >
                  <Icon className="size-4" />
                </div>
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="tabular-nums text-sm text-muted-foreground">{formatCents(a.balance)}</p>
              </Link>
            );
          })}
        </section>
      )}

      {data.topBudgets.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Budgets</p>
            <Link href="/budgets" className="text-xs text-primary">
              See all
            </Link>
          </div>
          {data.topBudgets.map((b) => (
            <BudgetProgressBar key={b._id} budget={b} />
          ))}
        </section>
      )}

      {data.topGoals.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Savings goals</p>
            <Link href="/goals" className="text-xs text-primary">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data.topGoals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
              return (
                <div key={g._id} className="min-w-[160px] rounded-xl border border-border bg-card p-3">
                  <p className="truncate text-sm font-medium">{g.name}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {formatCents(g.currentAmount)} / {formatCents(g.targetAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Recent activity</p>
          <Link href="/transactions" className="text-xs text-primary">
            See all
          </Link>
        </div>
        {data.recentTransactions.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet.</p>
        )}
        <div className="divide-y divide-border">
          {data.recentTransactions.map((tx) => (
            <TransactionRow key={tx._id} transaction={tx} onDelete={() => removeTransaction(tx._id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
