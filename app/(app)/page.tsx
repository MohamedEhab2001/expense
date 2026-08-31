"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CreditCard, Flame, Leaf } from "lucide-react";
import { formatCents } from "@/lib/utils/currency";
import { getIcon } from "@/lib/icon-map";
import { AnimatedCurrency } from "@/components/shared/AnimatedCurrency";
import { BalancesByCurrency } from "@/components/shared/BalancesByCurrency";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { postJSON } from "@/lib/fetcher";
import { useDashboardSummary, useInvalidate } from "@/lib/queries";
import { toast } from "sonner";

const BALANCE_PREF_KEY = "dashboard-balance-includes-savings";

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
  const reduceMotion = useReducedMotion();
  const [includeSavings, setIncludeSavings] = useState(false);

  // Sync from localStorage after mount to avoid a server/client hydration mismatch.
  useEffect(() => {
    const stored = localStorage.getItem(BALANCE_PREF_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external system, on mount
    if (stored !== null) setIncludeSavings(stored === "true");
  }, []);

  function toggleIncludeSavings(value: boolean) {
    setIncludeSavings(value);
    localStorage.setItem(BALANCE_PREF_KEY, String(value));
  }

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
          className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors active:bg-secondary/50"
        >
          No accounts yet. Tap here to add one and get started.
        </Link>
      </div>
    );
  }

  const itemDelay = (i: number) => (reduceMotion ? 0 : i * 0.04);

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {includeSavings ? "Total balance" : "Balance"}
          </p>
          <div className="flex rounded-full border border-border p-0.5 text-xs">
            <button
              onClick={() => toggleIncludeSavings(false)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                !includeSavings ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Without savings
            </button>
            <button
              onClick={() => toggleIncludeSavings(true)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                includeSavings ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              With savings
            </button>
          </div>
        </div>
        <BalancesByCurrency
          balances={includeSavings ? data.balancesByCurrency : data.balancesByCurrencyExcludingSavings}
        />
      </header>

      {(data.streaks.logStreak > 0 || data.streaks.noSpendStreak > 0) && (
        <div className="flex flex-wrap gap-2">
          {data.streaks.logStreak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
              <Flame className="size-3.5 text-orange-500" />
              {data.streaks.logStreak}-day logging streak
            </div>
          )}
          {data.streaks.noSpendStreak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
              <Leaf className="size-3.5 text-success" />
              {data.streaks.noSpendStreak}-day no-spend streak
            </div>
          )}
        </div>
      )}

      {data.spendingPace.percentOfPace !== null && (
        <Link href="/insights" className="rounded-xl border border-border bg-card p-3 transition-transform active:scale-[0.98]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Spending pace this month</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                data.spendingPace.percentOfPace >= 100 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {data.spendingPace.percentOfPace}% of typical
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                data.spendingPace.percentOfPace >= 100
                  ? "bg-destructive"
                  : data.spendingPace.percentOfPace >= 80
                    ? "bg-warning"
                    : "bg-success"
              )}
              style={{ width: `${Math.min(100, data.spendingPace.percentOfPace)}%` }}
            />
          </div>
        </Link>
      )}

      {data.upcomingDebts.length > 0 && (
        <Link
          href="/debts"
          className="flex flex-col gap-2 rounded-xl border border-l-4 border-warning bg-card p-3 transition-transform active:scale-[0.98]"
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
              — {d.name}
              {d.monthlyPayment ? ` · ${formatCents(d.monthlyPayment, d.currency)}` : ""}
            </p>
          ))}
        </Link>
      )}

      {data.creditCardAlerts.length > 0 && (
        <Link
          href="/accounts"
          className="flex flex-col gap-2 rounded-xl border border-l-4 border-warning bg-card p-3 transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 text-warning">
            <CreditCard className="size-4" />
            <p className="text-sm font-medium">
              {data.creditCardAlerts.length} card payment{data.creditCardAlerts.length > 1 ? "s" : ""} due
            </p>
          </div>
          {data.creditCardAlerts.map((c) => (
            <p key={c._id} className="text-xs text-muted-foreground">
              <span className={c.status === "overdue" ? "font-medium text-destructive" : "font-medium text-warning"}>
                {c.status === "overdue" ? "Overdue" : `Due day ${c.statementDay}`}
              </span>{" "}
              — {c.name} · {formatCents(Math.max(0, -c.balance), c.currency)} owed
            </p>
          ))}
        </Link>
      )}

      {data.accounts.length > 0 && (
        <section className="flex gap-3 overflow-x-auto pb-1">
          {data.accounts.map((a, i) => {
            const Icon = getIcon(a.icon);
            return (
              <motion.div
                key={a._id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: itemDelay(i) }}
              >
                <Link
                  href="/accounts"
                  className="flex min-w-[140px] flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-transform active:scale-[0.98]"
                >
                  <div
                    className="flex size-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${a.color}26`, color: a.color }}
                  >
                    <Icon className="size-4" />
                  </div>
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="tabular-nums text-sm text-muted-foreground">
                    {a.type === "credit_card" ? (
                      <>
                        <AnimatedCurrency cents={Math.max(0, -a.balance)} currency={a.currency} /> owed
                      </>
                    ) : (
                      <AnimatedCurrency cents={a.balance} currency={a.currency} />
                    )}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </section>
      )}

      {data.topDebts.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Debts & installments</p>
            <Link href="/debts" className="text-xs text-primary">
              See all
            </Link>
          </div>
          {data.topDebts.map((d) => {
            const Icon = getIcon(d.icon);
            return (
              <Link
                key={d._id}
                href="/debts"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-transform active:scale-[0.98]"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${d.color}26`, color: d.color }}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.status === "overdue"
                      ? "Overdue"
                      : d.status === "due_soon"
                        ? `Due day ${d.dueDay}`
                        : d.paymentSchedule === "one_time"
                          ? "Pay whenever"
                          : d.dueDay
                            ? `Due day ${d.dueDay}`
                            : "Ongoing"}
                  </p>
                </div>
                <p className="tabular-nums text-sm font-semibold">
                  <AnimatedCurrency cents={d.remainingAmount} currency={d.currency} />
                </p>
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
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    <AnimatedCurrency cents={g.currentAmount} currency={g.currency} /> / {formatCents(g.targetAmount, g.currency)}
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
          {data.recentTransactions.map((tx, i) => (
            <motion.div
              key={tx._id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: itemDelay(i) }}
            >
              <TransactionRow
                transaction={tx}
                onDelete={() => removeTransaction(tx._id)}
                onChanged={() => invalidate.all()}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
