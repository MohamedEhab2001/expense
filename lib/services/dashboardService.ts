import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import { listTransactions, getStreaks } from "./transactionService";
import { getMonthlyBudgetStatus } from "./budgetService";
import { listGoals } from "./goalService";
import { getUpcomingDebts, listDebts } from "./debtService";
import { getCreditCardAlerts } from "./accountService";
import { getSpendingPace } from "./analyticsService";
import type { DebtStatus } from "./debtService";

const DEBT_STATUS_RANK: Record<DebtStatus, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  paid: 3,
  paid_off: 4,
};

export async function getDashboardSummary() {
  await connectDB();

  const [
    accounts,
    recentTransactions,
    budgetStatus,
    goals,
    allDebts,
    upcomingDebts,
    creditCardAlerts,
    streaks,
    spendingPace,
  ] = await Promise.all([
    Account.find({ isArchived: false }).sort({ order: 1 }).lean(),
    listTransactions({ limit: 8 }),
    getMonthlyBudgetStatus(),
    listGoals(),
    listDebts(),
    getUpcomingDebts(),
    getCreditCardAlerts(),
    getStreaks(),
    getSpendingPace(),
  ]);

  const topDebts = allDebts
    .filter((d) => d.status !== "paid_off")
    .sort(
      (a, b) =>
        DEBT_STATUS_RANK[a.status] - DEBT_STATUS_RANK[b.status] || (a.dueDay ?? 99) - (b.dueDay ?? 99)
    )
    .slice(0, 3);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBalanceExcludingSavings = accounts
    .filter((a) => a.type !== "savings")
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    accounts,
    totalBalance,
    totalBalanceExcludingSavings,
    recentTransactions,
    topBudgets: budgetStatus.sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 3),
    topGoals: goals.slice(0, 3),
    topDebts,
    upcomingDebts,
    creditCardAlerts,
    streaks,
    spendingPace,
  };
}
