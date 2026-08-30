import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import type {
  AccountDTO,
  CategoryDTO,
  TransactionDTO,
  GoalDTO,
  AIInsightDTO,
  DashboardSummaryDTO,
} from "@/lib/types";

export const queryKeys = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  budgets: ["budgets"] as const,
  goals: ["goals"] as const,
  insights: ["insights"] as const,
  dashboard: ["dashboard"] as const,
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

export function useTransactions(limit = 100) {
  return useQuery({
    queryKey: [...queryKeys.transactions, limit],
    queryFn: () => fetcher<TransactionDTO[]>(`/api/transactions?limit=${limit}`),
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
    all: () => client.invalidateQueries(),
  };
}
