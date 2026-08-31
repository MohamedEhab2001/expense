export type AccountType = "cash" | "bank" | "credit_card" | "savings" | "other";
export type TransactionType = "expense" | "income" | "transfer" | "atm_withdrawal";
export type CategoryKind = "expense" | "income";
export type DebtType = "installment" | "debt" | "credit_card";
export type DebtStatus = "paid_off" | "paid" | "overdue" | "due_soon" | "upcoming";
export type DebtPaymentSchedule = "monthly" | "one_time";
export type CreditCardStatus = "overdue" | "due_soon" | "upcoming";

export interface AccountDTO {
  _id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  creditLimit?: number;
  statementDay?: number;
  icon: string;
  color: string;
  isArchived: boolean;
  order: number;
}

export interface CreditCardAlertDTO {
  _id: string;
  name: string;
  currency: string;
  balance: number;
  creditLimit?: number;
  statementDay: number;
  status: CreditCardStatus;
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

export interface TransactionLocationDTO {
  city?: string;
  governorate?: string;
  lat?: number;
  lon?: number;
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
  location?: TransactionLocationDTO;
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
  currency: string;
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

export interface StreaksDTO {
  logStreak: number;
  noSpendStreak: number;
}

export interface SpendingPaceDTO {
  monthToDateExpense: number;
  expectedPace: number;
  percentOfPace: number | null;
}

export interface CurrencyBalanceDTO {
  currency: string;
  amount: number;
}

export interface DashboardSummaryDTO {
  accounts: AccountDTO[];
  totalBalance: number;
  totalBalanceExcludingSavings: number;
  balancesByCurrency: CurrencyBalanceDTO[];
  balancesByCurrencyExcludingSavings: CurrencyBalanceDTO[];
  recentTransactions: TransactionDTO[];
  topBudgets: BudgetStatusDTO[];
  topGoals: GoalDTO[];
  topDebts: DebtDTO[];
  upcomingDebts: DebtDTO[];
  creditCardAlerts: CreditCardAlertDTO[];
  streaks: StreaksDTO;
  spendingPace: SpendingPaceDTO;
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

export type ExpensePeriod = "day" | "month" | "quarter" | "year";

export interface ExpenseBreakdownBarDTO {
  label: string;
  amount: number;
  color?: string;
}

export interface ExpenseSummaryDTO {
  period: ExpensePeriod;
  date: string;
  rangeLabel: string;
  total: number;
  previousTotal: number;
  breakdown: ExpenseBreakdownBarDTO[];
}

export interface NetWorthPointDTO {
  date: string;
  label: string;
  netWorth: number;
}

export interface DebtDTO {
  _id: string;
  name: string;
  type: DebtType;
  paymentSchedule: DebtPaymentSchedule;
  totalAmount?: number;
  remainingAmount: number;
  currency: string;
  monthlyPayment?: number;
  dueDay?: number;
  linkedAccountId?: RefLite;
  lastPaidMonth?: string;
  icon: string;
  color: string;
  isPaidOff: boolean;
  isArchived: boolean;
  status: DebtStatus;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
}
