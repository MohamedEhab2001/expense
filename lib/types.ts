export type AccountType = "cash" | "bank" | "credit_card" | "savings" | "other";
export type TransactionType = "expense" | "income" | "transfer" | "atm_withdrawal";
export type CategoryKind = "expense" | "income";

export interface AccountDTO {
  _id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  isArchived: boolean;
  order: number;
}

export interface CategoryDTO {
  _id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  isArchived: boolean;
  order: number;
}

export interface RefLite {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface TransactionDTO {
  _id: string;
  type: TransactionType;
  amount: number;
  accountId: RefLite;
  linkedAccountId?: RefLite;
  categoryId?: RefLite;
  date: string;
  note?: string;
  merchant?: string;
}

export interface BudgetStatusDTO {
  _id: string;
  category: RefLite;
  budgeted: number;
  spent: number;
  percentUsed: number;
  rollover: boolean;
}

export interface GoalDTO {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  linkedAccountId?: RefLite;
  icon: string;
  color: string;
  isArchived: boolean;
}

export interface InsightItemDTO {
  type: "spending_pattern" | "budget_adherence" | "savings_feasibility" | "suggestion";
  title: string;
  body: string;
  severity: "info" | "warning" | "positive";
}

export interface AIInsightDTO {
  _id: string;
  generatedAt: string;
  summary: string;
  insights: InsightItemDTO[];
  model: string;
}

export interface DashboardSummaryDTO {
  accounts: AccountDTO[];
  totalBalance: number;
  recentTransactions: TransactionDTO[];
  topBudgets: BudgetStatusDTO[];
  topGoals: GoalDTO[];
}

export interface CategoryBreakdownItemDTO {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
}

export interface MonthlyTrendItemDTO {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface AnalyticsDTO {
  categoryBreakdown: CategoryBreakdownItemDTO[];
  trend: MonthlyTrendItemDTO[];
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
}
