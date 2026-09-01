import "server-only";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { openai, AI_MODEL } from "@/lib/openai";
import Account, { type Account as AccountDoc } from "@/models/Account";
import Category from "@/models/Category";
import { listDebts } from "./debtService";
import { fromCents } from "@/lib/utils/currency";
import type { CalculatorInput } from "@/lib/validation/calculator";
import type { CalculatorResultDTO, CalculatorVerdict } from "@/lib/types";

interface PlanContext {
  spendablePool: number;
  transfersNetEffect: number;
  transferBreakdown: { label: string; amount: number }[];
  totalPlannedSpending: number;
  monthlyDebtTotal: number;
  debtBreakdown: { name: string; amount: number }[];
  finalSpendable: number;
  categoryBreakdown: { name: string; amount: number }[];
  upcomingDebts: { name: string; amount: number }[];
}

async function buildContext(input: CalculatorInput): Promise<PlanContext> {
  await connectDB();

  const [accounts, categories, debts] = await Promise.all([
    Account.find({ currency: input.currency, isArchived: false }).lean(),
    Category.find({ _id: { $in: input.categoryPlan.map((c) => c.categoryId) } }).lean(),
    listDebts(),
  ]);
  const currencyDebts = debts.filter((d) => d.currency === input.currency);

  const accountsById = new Map(accounts.map((a) => [String(a._id), a]));

  // "Spendable" is deliberately narrow: only cash/bank accounts — money you can freely spend
  // today. Savings, credit cards, and misc ("other") accounts are excluded, so paying down a
  // credit card (e.g. an informal loan tracked as a credit_card account) counts the same as
  // moving money to savings: it's gone from what's available, even though it doesn't change
  // net worth. A pure "exclude savings only" pool would net a debt payoff to zero and make it
  // look like the transfer had no effect.
  const spendablePool = accounts.filter((a) => isSpendable(a)).reduce((s, a) => s + a.balance, 0);

  let transfersNetEffect = 0;
  const transferBreakdown: { label: string; amount: number }[] = [];
  for (const t of input.transfers) {
    const from = accountsById.get(t.fromAccountId);
    const to = accountsById.get(t.toAccountId);
    if (!from || !to) continue; // account isn't in this currency's pool — ignore
    const fromSpendable = isSpendable(from);
    const toSpendable = isSpendable(to);
    if (fromSpendable && !toSpendable) {
      transfersNetEffect -= t.amount; // left the spendable pool
      transferBreakdown.push({ label: `${from.name} → ${to.name}`, amount: -t.amount });
    } else if (!fromSpendable && toSpendable) {
      transfersNetEffect += t.amount; // came back into it
      transferBreakdown.push({ label: `${from.name} → ${to.name}`, amount: t.amount });
    }
    // both spendable or both non-spendable: no effect on the spendable pool, not shown
  }

  const totalPlannedSpending = input.categoryPlan.reduce((s, c) => s + c.amount, 0);

  // Fixed monthly debt payments (loans, installments, recurring credit card minimums) are a
  // committed cost the same as planned category spending — a debt already paid this cycle or
  // paid off entirely isn't due again, so it's excluded.
  const monthlyDebts = currencyDebts.filter(
    (d) =>
      d.paymentSchedule === "monthly" &&
      d.status !== "paid" &&
      d.status !== "paid_off" &&
      (d.monthlyPayment ?? 0) > 0
  );
  const monthlyDebtTotal = monthlyDebts.reduce((s, d) => s + (d.monthlyPayment ?? 0), 0);
  const debtBreakdown = monthlyDebts.map((d) => ({ name: d.name, amount: d.monthlyPayment ?? 0 }));

  const finalSpendable =
    spendablePool + transfersNetEffect - totalPlannedSpending - monthlyDebtTotal - input.purchaseAmount;

  const categoriesById = new Map(categories.map((c) => [String(c._id), c]));
  const categoryBreakdown = input.categoryPlan
    .filter((c) => c.amount > 0)
    .map((c) => ({ name: categoriesById.get(c.categoryId)?.name ?? "Uncategorized", amount: c.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    spendablePool,
    transfersNetEffect,
    transferBreakdown,
    totalPlannedSpending,
    monthlyDebtTotal,
    debtBreakdown,
    finalSpendable,
    categoryBreakdown,
    // Overdue/due-soon debts (including one-time ones already covered above), for AI context.
    upcomingDebts: currencyDebts
      .filter((d) => d.status === "overdue" || d.status === "due_soon")
      .map((d) => ({ name: d.name, amount: d.remainingAmount })),
  };
}

function isSpendable(account: Pick<AccountDoc, "type">) {
  return account.type === "cash" || account.type === "bank";
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

const SYSTEM_PROMPT = `You are a personal finance decision-making assistant embedded in a budgeting app. The user has told you exactly how they plan to spend money by category this month, any transfers they plan to make between their own accounts, and a purchase they're considering. Only cash/bank account balances count as "available" — savings, credit cards, and other non-liquid accounts are intentionally excluded, so a transfer into any of those (including paying down a debt) is treated as money leaving what's available, even though it doesn't change net worth. Fixed monthly debt payments due this cycle (loans, installments, recurring minimums) are already deducted as a committed cost, same as planned category spending. Treat all of that as final, don't suggest dipping into savings, skipping a fixed debt payment, or reversing a planned transfer. You're given a JSON digest of that plan plus a pre-computed verdict. Write a short, concrete headline, a 2-4 sentence reasoning grounded in the actual numbers (name real categories, transfers, debt payments, or debts overdue/due soon that affect the outcome), and 1-4 short actionable tips. Do not repeat the raw JSON back. Do not give regulated investment or tax advice.`;

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
    transfers: ctx.transferBreakdown.map((t) => ({ transfer: t.label, effectOnSpendable: fromCents(t.amount) })),
    transfersNetEffectOnSpendable: fromCents(ctx.transfersNetEffect),
    fixedMonthlyDebtPayments: ctx.debtBreakdown.map((d) => ({ debt: d.name, amount: fromCents(d.amount) })),
    totalMonthlyDebtPayments: fromCents(ctx.monthlyDebtTotal),
    finalSpendable: fromCents(ctx.finalSpendable),
    overdueOrDueSoonDebts: ctx.upcomingDebts.map((d) => ({ name: d.name, amount: fromCents(d.amount) })),
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
    transferBreakdown: ctx.transferBreakdown,
    monthlyDebtTotal: ctx.monthlyDebtTotal,
    debtBreakdown: ctx.debtBreakdown,
    purchaseAmount: input.purchaseAmount,
    finalSpendable: ctx.finalSpendable,
    ai,
  };
}
