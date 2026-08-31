import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import type {
  AccountDTO,
  CategoryDTO,
  TransactionDTO,
  GoalDTO,
  AIInsightDTO,
  DashboardSummaryDTO,
  AnalyticsDTO,
  TransactionFilters,
  DebtDTO,
  ExpensePeriod,
  ExpenseSummaryDTO,
} from "@/lib/types";

export const queryKeys = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  budgets: ["budgets"] as const,
  goals: ["goals"] as const,
  insights: ["insights"] as const,
  dashboard: ["dashboard"] as const,
  analytics: ["analytics"] as const,
  debts: ["debts"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => fetcher<AccountDTO[]>("/api/accounts"),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => fetcher<CategoryDTO[]>("/api/categories"),
  });
}

export function useTransactions(limit = 100, filters: TransactionFilters = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.type) params.set("type", filters.type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();

  return useQuery({
    queryKey: [...queryKeys.transactions, qs],
    queryFn: () => fetcher<TransactionDTO[]>(`/api/transactions?${qs}`),
  });
}

export interface BudgetsResponse {
  month: string;
  budgets: import("@/lib/types").BudgetStatusDTO[];
  unbudgetedCategories: CategoryDTO[];
}

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets,
    queryFn: () => fetcher<BudgetsResponse>("/api/budgets"),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => fetcher<GoalDTO[]>("/api/goals"),
  });
}

export function useInsightsHistory() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => fetcher<AIInsightDTO[]>("/api/insights"),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => fetcher<DashboardSummaryDTO>("/api/dashboard/summary"),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => fetcher<AnalyticsDTO>("/api/analytics"),
  });
}

export function useDebts() {
  return useQuery({
    queryKey: queryKeys.debts,
    queryFn: () => fetcher<DebtDTO[]>("/api/debts"),
  });
}

export function useExpenseSummary(period: ExpensePeriod, date: Date) {
  const dateKey = date.toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["expenseSummary", period, dateKey],
    queryFn: () => fetcher<ExpenseSummaryDTO>(`/api/analytics/expenses?period=${period}&date=${dateKey}`),
  });
}

export function useInvalidate() {
  const client = useQueryClient();
  return {
    accounts: () => client.invalidateQueries({ queryKey: queryKeys.accounts }),
    categories: () => client.invalidateQueries({ queryKey: queryKeys.categories }),
    transactions: () => client.invalidateQueries({ queryKey: queryKeys.transactions }),
    budgets: () => client.invalidateQueries({ queryKey: queryKeys.budgets }),
    goals: () => client.invalidateQueries({ queryKey: queryKeys.goals }),
    insights: () => client.invalidateQueries({ queryKey: queryKeys.insights }),
    dashboard: () => client.invalidateQueries({ queryKey: queryKeys.dashboard }),
    analytics: () => client.invalidateQueries({ queryKey: queryKeys.analytics }),
    debts: () => client.invalidateQueries({ queryKey: queryKeys.debts }),
    all: () => client.invalidateQueries(),
  };
}
