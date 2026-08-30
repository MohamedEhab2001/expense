import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import { listTransactions } from "./transactionService";
import { getMonthlyBudgetStatus } from "./budgetService";
import { listGoals } from "./goalService";

export async function getDashboardSummary() {
  await connectDB();

  const [accounts, recentTransactions, budgetStatus, goals] = await Promise.all([
    Account.find({ isArchived: false }).sort({ order: 1 }).lean(),
    listTransactions({ limit: 8 }),
    getMonthlyBudgetStatus(),
    listGoals(),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return {
    accounts,
    totalBalance,
    recentTransactions,
    topBudgets: budgetStatus.sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 3),
    topGoals: goals.slice(0, 3),
  };
}
