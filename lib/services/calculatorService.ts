import "server-only";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { openai, AI_MODEL } from "@/lib/openai";
import Account from "@/models/Account";
import Category from "@/models/Category";
import { getUpcomingDebts } from "./debtService";
import { fromCents } from "@/lib/utils/currency";
import type { CalculatorInput } from "@/lib/validation/calculator";
import type { CalculatorResultDTO, CalculatorVerdict } from "@/lib/types";

interface PlanContext {
  currency: string;
  accountName: string;
  startingBalance: number;
  transfersNetEffect: number;
  totalPlannedSpending: number;
  finalBalance: number;
  categoryBreakdown: { name: string; amount: number }[];
  upcomingDebts: { name: string; amount: number }[];
}

async function buildContext(input: CalculatorInput): Promise<PlanContext> {
  await connectDB();

  const payFromAccount = await Account.findById(input.payFromAccountId).lean();
  if (!payFromAccount || payFromAccount.isArchived) {
    throw new Error("That account isn't available anymore — pick another one.");
  }
  const currency = payFromAccount.currency;
  const payFromId = String(payFromAccount._id);

  const [accountsInCurrency, categories, upcomingDebts] = await Promise.all([
    // Needed to resolve each transfer's from/to accounts (and confirm they're in this currency).
    Account.find({ currency, isArchived: false }).lean(),
    Category.find({ _id: { $in: input.categoryPlan.map((c) => c.categoryId) } }).lean(),
    getUpcomingDebts(),
  ]);
  const accountsById = new Map(accountsInCurrency.map((a) => [String(a._id), a]));

  // Only transfers with one leg on the pay-from account affect its balance — a transfer
  // between two other accounts genuinely doesn't change what's in this one.
  let transfersNetEffect = 0;
  for (const t of input.transfers) {
    const from = accountsById.get(t.fromAccountId);
    const to = accountsById.get(t.toAccountId);
    if (!from || !to) continue; // account isn't in this currency — ignore
    const toIsPayFrom = String(to._id) === payFromId;
    const fromIsPayFrom = String(from._id) === payFromId;
    if (toIsPayFrom && !fromIsPayFrom) transfersNetEffect += t.amount;
    else if (fromIsPayFrom && !toIsPayFrom) transfersNetEffect -= t.amount;
    // both legs are the pay-from account (no-op), or neither is: no effect
  }

  const totalPlannedSpending = input.categoryPlan.reduce((s, c) => s + c.amount, 0);
  const finalBalance =
    payFromAccount.balance + transfersNetEffect - totalPlannedSpending - input.purchaseAmount;

  const categoriesById = new Map(categories.map((c) => [String(c._id), c]));
  const categoryBreakdown = input.categoryPlan
    .filter((c) => c.amount > 0)
    .map((c) => ({ name: categoriesById.get(c.categoryId)?.name ?? "Uncategorized", amount: c.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    currency,
    accountName: payFromAccount.name,
    startingBalance: payFromAccount.balance,
    transfersNetEffect,
    totalPlannedSpending,
    finalBalance,
    categoryBreakdown,
    upcomingDebts: upcomingDebts
      .filter((d) => d.currency === currency)
      .map((d) => ({ name: d.name, amount: d.remainingAmount })),
  };
}

function decideVerdict(startingBalance: number, finalBalance: number): CalculatorVerdict {
  if (finalBalance < 0) return "wait";
  const healthyMargin = startingBalance * 0.15; // keep at least ~15% of the starting balance as a cushion
  return finalBalance >= healthyMargin ? "go_for_it" : "doable_with_caution";
}

const aiVerdictSchema = z.object({
  headline: z.string(),
  reasoning: z.string(),
  tips: z.array(z.string()).min(1).max(4),
});

const SYSTEM_PROMPT = `You are a personal finance decision-making assistant embedded in a budgeting app. The user has told you exactly which account they'll pay from, how they plan to spend money by category this month, any transfers they plan to make between their own accounts, and a purchase they're considering. Savings accounts are intentionally excluded as a pay-from option — treat that as final, don't suggest dipping into savings. You're given a JSON digest of that plan plus a pre-computed verdict. Write a short, concrete headline, a 2-4 sentence reasoning grounded in the actual numbers (name real categories, transfers, or debts due soon that affect the outcome), and 1-4 short actionable tips. Do not repeat the raw JSON back. Do not give regulated investment or tax advice.`;

async function getAIVerdict(input: CalculatorInput, ctx: PlanContext, verdict: CalculatorVerdict) {
  const context = {
    request: {
      item: input.note || "this purchase",
      amount: fromCents(input.purchaseAmount),
      currency: ctx.currency,
      recurring: input.isRecurring,
    },
    payFromAccount: ctx.accountName,
    startingBalance: fromCents(ctx.startingBalance),
    plannedCategorySpending: ctx.categoryBreakdown.map((c) => ({ category: c.name, amount: fromCents(c.amount) })),
    totalPlannedSpending: fromCents(ctx.totalPlannedSpending),
    transfersNetEffectOnThisAccount: fromCents(ctx.transfersNetEffect),
    finalBalance: fromCents(ctx.finalBalance),
    upcomingDebts: ctx.upcomingDebts.map((d) => ({ name: d.name, amount: fromCents(d.amount) })),
    deterministicVerdict: verdict,
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
    // The deterministic numbers are still useful on their own — don't fail the whole
    // request just because the OpenAI call errored or returned something unparseable.
    return null;
  }
}

export async function runCalculator(input: CalculatorInput): Promise<CalculatorResultDTO> {
  const ctx = await buildContext(input);
  const verdict = decideVerdict(ctx.startingBalance, ctx.finalBalance);
  const ai = await getAIVerdict(input, ctx, verdict);

  return {
    verdict,
    currency: ctx.currency,
    accountName: ctx.accountName,
    startingBalance: ctx.startingBalance,
    totalPlannedSpending: ctx.totalPlannedSpending,
    transfersNetEffect: ctx.transfersNetEffect,
    purchaseAmount: input.purchaseAmount,
    finalBalance: ctx.finalBalance,
    ai,
  };
}
