import "server-only";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { openai, AI_MODEL } from "@/lib/openai";
import Account, { type Account as AccountDoc } from "@/models/Account";
import Category from "@/models/Category";
import { getUpcomingDebts } from "./debtService";
import { fromCents } from "@/lib/utils/currency";
import type { CalculatorInput } from "@/lib/validation/calculator";
import type { CalculatorResultDTO, CalculatorVerdict } from "@/lib/types";

interface PlanContext {
  spendablePool: number;
  transfersNetEffect: number;
  totalPlannedSpending: number;
  finalSpendable: number;
  categoryBreakdown: { name: string; amount: number }[];
  upcomingDebts: { name: string; amount: number }[];
}

async function buildContext(input: CalculatorInput): Promise<PlanContext> {
  await connectDB();

  const [accounts, categories, upcomingDebts] = await Promise.all([
    Account.find({ currency: input.currency, isArchived: false }).lean(),
    Category.find({ _id: { $in: input.categoryPlan.map((c) => c.categoryId) } }).lean(),
    getUpcomingDebts(),
  ]);

  const accountsById = new Map(accounts.map((a) => [String(a._id), a]));

  // The user asked for savings to be excluded entirely — mirrors dashboardService's
  // totalBalanceExcludingSavings: money sitting in a "savings" account isn't counted as
  // available for this purchase.
  const spendablePool = accounts
    .filter((a) => a.type !== "savings")
    .reduce((s, a) => s + a.balance, 0);

  let transfersNetEffect = 0;
  for (const t of input.transfers) {
    const from = accountsById.get(t.fromAccountId);
    const to = accountsById.get(t.toAccountId);
    if (!from || !to) continue; // account isn't in this currency's pool — ignore
    const fromSavings = isSavings(from);
    const toSavings = isSavings(to);
    if (fromSavings && !toSavings) transfersNetEffect += t.amount; // freed up from savings
    else if (!fromSavings && toSavings) transfersNetEffect -= t.amount; // locked away into savings
    // both spendable or both savings: no effect on the spendable pool
  }

  const totalPlannedSpending = input.categoryPlan.reduce((s, c) => s + c.amount, 0);
  const finalSpendable = spendablePool + transfersNetEffect - totalPlannedSpending - input.purchaseAmount;

  const categoriesById = new Map(categories.map((c) => [String(c._id), c]));
  const categoryBreakdown = input.categoryPlan
    .filter((c) => c.amount > 0)
    .map((c) => ({ name: categoriesById.get(c.categoryId)?.name ?? "Uncategorized", amount: c.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    spendablePool,
    transfersNetEffect,
    totalPlannedSpending,
    finalSpendable,
    categoryBreakdown,
    upcomingDebts: upcomingDebts
      .filter((d) => d.currency === input.currency)
      .map((d) => ({ name: d.name, amount: d.remainingAmount })),
  };
}

function isSavings(account: Pick<AccountDoc, "type">) {
  return account.type === "savings";
}

function decideVerdict(spendablePool: number, finalSpendable: number): CalculatorVerdict {
  if (finalSpendable < 0) return "wait";
  const healthyMargin = spendablePool * 0.15; // keep at least ~15% of the pool as a cushion
  return finalSpendable >= healthyMargin ? "go_for_it" : "doable_with_caution";
}

const aiVerdictSchema = z.object({
  headline: z.string(),
  reasoning: z.string(),
  tips: z.array(z.string()).min(1).max(4),
});

const SYSTEM_PROMPT = `You are a personal finance decision-making assistant embedded in a budgeting app. The user has told you exactly how they plan to spend money by category this month, any transfers they plan to make between their own accounts (including into/out of savings), and a purchase they're considering. Savings account balances are intentionally excluded from what's "available" — treat that as final, don't suggest dipping into savings. You're given a JSON digest of that plan plus a pre-computed verdict. Write a short, concrete headline, a 2-4 sentence reasoning grounded in the actual numbers (name real categories, transfers, or debts due soon that affect the outcome), and 1-4 short actionable tips. Do not repeat the raw JSON back. Do not give regulated investment or tax advice.`;

async function getAIVerdict(input: CalculatorInput, ctx: PlanContext, verdict: CalculatorVerdict) {
  const context = {
    request: {
      item: input.note || "this purchase",
      amount: fromCents(input.purchaseAmount),
      currency: input.currency,
      recurring: input.isRecurring,
    },
    spendablePool: fromCents(ctx.spendablePool),
    plannedCategorySpending: ctx.categoryBreakdown.map((c) => ({ category: c.name, amount: fromCents(c.amount) })),
    totalPlannedSpending: fromCents(ctx.totalPlannedSpending),
    transfersNetEffectOnSpendable: fromCents(ctx.transfersNetEffect),
    finalSpendable: fromCents(ctx.finalSpendable),
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
  const verdict = decideVerdict(ctx.spendablePool, ctx.finalSpendable);
  const ai = await getAIVerdict(input, ctx, verdict);

  return {
    verdict,
    currency: input.currency,
    spendablePool: ctx.spendablePool,
    totalPlannedSpending: ctx.totalPlannedSpending,
    transfersNetEffect: ctx.transfersNetEffect,
    purchaseAmount: input.purchaseAmount,
    finalSpendable: ctx.finalSpendable,
    ai,
  };
}
