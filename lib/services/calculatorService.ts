import "server-only";
import { connectDB } from "@/lib/db";
import Account, { type Account as AccountDoc } from "@/models/Account";
import { listDebts } from "./debtService";
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
}

async function buildContext(input: CalculatorInput): Promise<PlanContext> {
  await connectDB();

  const [accounts, debts] = await Promise.all([
    Account.find({ currency: input.currency, isArchived: false }).lean(),
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

  return {
    spendablePool,
    transfersNetEffect,
    transferBreakdown,
    totalPlannedSpending,
    monthlyDebtTotal,
    debtBreakdown,
    finalSpendable,
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

export async function runCalculator(input: CalculatorInput): Promise<CalculatorResultDTO> {
  const ctx = await buildContext(input);
  const verdict = decideVerdict(ctx.spendablePool, ctx.finalSpendable);

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
  };
}
