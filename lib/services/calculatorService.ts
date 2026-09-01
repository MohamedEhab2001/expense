import "server-only";
import { z } from "zod";
import { format, subMonths, addMonths } from "date-fns";
import { connectDB } from "@/lib/db";
import { openai, AI_MODEL } from "@/lib/openai";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { listDebts } from "./debtService";
import { listGoals } from "./goalService";
import { getMonthlyBudgetStatus } from "./budgetService";
import { monthRange, monthKey } from "@/lib/utils/dates";
import { fromCents } from "@/lib/utils/currency";
import type { CalculatorInput } from "@/lib/validation/calculator";
import type {
  CalculatorProjectionPointDTO,
  CalculatorResultDTO,
  CalculatorVerdict,
} from "@/lib/types";

interface Snapshot {
  currency: string;
  currentBalance: number; // cents, summed across all accounts in this currency
  floor: number; // cents; most negative the pooled balance can safely go (credit limits)
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  recurringDebtTotal: number;
  recurringGoalContribution: number;
  topBudgetPressure: { category: string; percentUsed: number }[];
  dueSoonDebts: { name: string; amount: number }[];
}

// Average income/expense (in cents) for accounts of `currency`, over the 3 full months
// before the current one — same "trailing 3 full months" window analyticsService.getSpendingPace
// uses for its pace baseline.
async function avgMonthlyFlow(currency: string) {
  const now = new Date();
  const totals = await Promise.all(
    [1, 2, 3].map(async (n) => {
      const { start, end } = monthRange(monthKey(subMonths(now, n)));
      const rows = await Transaction.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: { $in: ["income", "expense"] } } },
        { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "acc" } },
        { $unwind: "$acc" },
        { $match: { "acc.currency": currency } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]);
      return {
        income: rows.find((r) => r._id === "income")?.total ?? 0,
        expense: rows.find((r) => r._id === "expense")?.total ?? 0,
      };
    })
  );

  const monthsWithActivity = totals.filter((t) => t.income > 0 || t.expense > 0);
  const divisor = monthsWithActivity.length || 1;
  return {
    avgMonthlyIncome: totals.reduce((s, t) => s + t.income, 0) / divisor,
    avgMonthlyExpense: totals.reduce((s, t) => s + t.expense, 0) / divisor,
  };
}

async function buildSnapshot(currency: string): Promise<Snapshot> {
  await connectDB();

  const [accounts, flow, debts, goals, budgets] = await Promise.all([
    Account.find({ currency, isArchived: false }).lean(),
    avgMonthlyFlow(currency),
    listDebts(),
    listGoals(),
    getMonthlyBudgetStatus(),
  ]);

  const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const floor = -accounts.reduce((s, a) => s + (a.type === "credit_card" ? (a.creditLimit ?? 0) : 0), 0);

  const currencyDebts = debts.filter(
    (d) => d.currency === currency && !d.isPaidOff && !d.isArchived
  );
  const recurringDebtTotal = currencyDebts
    .filter((d) => d.paymentSchedule === "monthly")
    .reduce((s, d) => s + (d.monthlyPayment ?? 0), 0);
  const dueSoonDebts = currencyDebts
    .filter((d) => d.status === "overdue" || d.status === "due_soon")
    .map((d) => ({ name: d.name, amount: d.remainingAmount }));

  const now = new Date();
  const recurringGoalContribution = goals
    .filter((g) => g.currency === currency && !g.isArchived && g.targetDate)
    .reduce((sum, g) => {
      const monthsLeft = Math.max(
        1,
        Math.round((new Date(g.targetDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return sum + remaining / monthsLeft;
    }, 0);

  // Budgets aren't currency-tagged (categories are shared across accounts/currencies, same
  // caveat as the rest of the app — see dashboardService's blended-totals note), so this is
  // global context for the AI narrative rather than part of the currency-scoped math.
  const topBudgetPressure = budgets
    .filter((b) => b.percentUsed >= 80)
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3)
    .map((b) => ({
      category: (b.category as unknown as { name: string })?.name ?? "Unknown",
      percentUsed: b.percentUsed,
    }));

  return {
    currency,
    currentBalance,
    floor,
    avgMonthlyIncome: flow.avgMonthlyIncome,
    avgMonthlyExpense: flow.avgMonthlyExpense,
    recurringDebtTotal,
    recurringGoalContribution,
    topBudgetPressure,
    dueSoonDebts,
  };
}

function simulate(input: CalculatorInput, snapshot: Snapshot) {
  const oneTimeAmount = input.isRecurring ? 0 : input.amount;
  const recurringAmount = input.isRecurring ? input.amount : 0;
  const netMonthlyFlow =
    snapshot.avgMonthlyIncome -
    snapshot.avgMonthlyExpense -
    snapshot.recurringDebtTotal -
    snapshot.recurringGoalContribution;

  const now = new Date();
  const projection: CalculatorProjectionPointDTO[] = [
    { month: 0, label: "Now", withPurchase: snapshot.currentBalance - oneTimeAmount, baseline: snapshot.currentBalance },
  ];

  let withBalance = snapshot.currentBalance - oneTimeAmount;
  let baseline = snapshot.currentBalance;
  for (let i = 1; i <= input.months; i++) {
    withBalance += netMonthlyFlow - recurringAmount;
    baseline += netMonthlyFlow;
    projection.push({ month: i, label: format(addMonths(now, i), "MMM"), withPurchase: withBalance, baseline });
  }

  const minProjectedBalance = Math.min(...projection.map((p) => p.withPurchase));
  const safetyBuffer = snapshot.avgMonthlyExpense; // one month of typical spend, as a cushion

  let verdict: CalculatorVerdict;
  if (minProjectedBalance >= snapshot.floor + safetyBuffer) {
    verdict = "go_for_it";
  } else if (minProjectedBalance >= snapshot.floor) {
    verdict = "doable_with_caution";
  } else {
    verdict = "wait";
  }

  return { projection, minProjectedBalance, netMonthlyFlow, verdict };
}

const aiVerdictSchema = z.object({
  headline: z.string(),
  reasoning: z.string(),
  tips: z.array(z.string()).min(1).max(4),
});

const SYSTEM_PROMPT = `You are a personal finance decision-making assistant embedded in a budgeting app. The user is deciding whether to make a hypothetical purchase. You are given a JSON digest of their real accounts, cash flow, debts, and savings goals in the relevant currency, a deterministic month-by-month balance projection with and without the purchase, and a pre-computed verdict. Write a short, concrete headline, a 2-4 sentence reasoning grounded in the actual numbers (name real debts/goals/budget categories it would affect), and 1-4 short actionable tips (e.g. wait N months, cut a specific category, split into installments). Do not repeat the raw JSON back. Do not give regulated investment or tax advice.`;

async function getAIVerdict(
  input: CalculatorInput,
  snapshot: Snapshot,
  sim: ReturnType<typeof simulate>
) {
  const context = {
    request: {
      item: input.note || "this purchase",
      amount: fromCents(input.amount),
      currency: input.currency,
      recurring: input.isRecurring,
    },
    currentBalance: fromCents(snapshot.currentBalance),
    avgMonthlyIncome: fromCents(snapshot.avgMonthlyIncome),
    avgMonthlyExpense: fromCents(snapshot.avgMonthlyExpense),
    recurringDebtPayments: fromCents(snapshot.recurringDebtTotal),
    recurringGoalContributions: fromCents(snapshot.recurringGoalContribution),
    dueSoonDebts: snapshot.dueSoonDebts.map((d) => ({ name: d.name, amount: fromCents(d.amount) })),
    overBudgetCategories: snapshot.topBudgetPressure,
    deterministicVerdict: sim.verdict,
    minProjectedBalance: fromCents(sim.minProjectedBalance),
    projectionMonths: input.months,
  };

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this affordability scenario and respond with ONLY a JSON object matching this shape: {"headline": string, "reasoning": string, "tips": string[]}.\n\nData:\n${JSON.stringify(context)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return aiVerdictSchema.parse(JSON.parse(content));
  } catch {
    // Deterministic numbers are still useful on their own — don't fail the whole request
    // just because the OpenAI call errored or returned something unparseable.
    return null;
  }
}

export async function runCalculator(input: CalculatorInput): Promise<CalculatorResultDTO> {
  const snapshot = await buildSnapshot(input.currency);
  const sim = simulate(input, snapshot);
  const ai = await getAIVerdict(input, snapshot, sim);

  return {
    verdict: sim.verdict,
    currency: input.currency,
    currentBalance: snapshot.currentBalance,
    minProjectedBalance: sim.minProjectedBalance,
    netMonthlyFlow: sim.netMonthlyFlow,
    projection: sim.projection,
    ai,
  };
}
