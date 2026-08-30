import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { openai, AI_MODEL } from "@/lib/openai";
import AIInsight from "@/models/AIInsight";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import "@/models/Category";
import { getMonthlyBudgetStatus } from "./budgetService";
import { listGoals } from "./goalService";
import { monthKey, monthRange, previousMonthKey } from "@/lib/utils/dates";
import { fromCents } from "@/lib/utils/currency";

const CACHE_TTL_HOURS = 6;
const MAX_STORED_INSIGHTS = 20;

const insightSchema = z.object({
  summary: z.string(),
  insights: z
    .array(
      z.object({
        type: z.enum(["spending_pattern", "budget_adherence", "savings_feasibility", "suggestion"]),
        title: z.string(),
        body: z.string(),
        severity: z.enum(["info", "warning", "positive"]),
      })
    )
    .min(1)
    .max(6),
});

async function buildContext() {
  const key = monthKey();
  const prevKey = previousMonthKey(key);
  const { start, end } = monthRange(key);
  const { start: prevStart, end: prevEnd } = monthRange(prevKey);

  const [accounts, budgets, goals, expenseByCategory, incomeTotalAgg, prevExpenseAgg, largeTx] =
    await Promise.all([
      Account.find({ isArchived: false }).lean(),
      getMonthlyBudgetStatus(key),
      listGoals(),
      Transaction.aggregate([
        { $match: { type: "expense", date: { $gte: start, $lte: end } } },
        { $group: { _id: "$categoryId", amount: { $sum: "$amount" } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      ]),
      Transaction.aggregate([
        { $match: { type: "income", date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "expense", date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.find({ type: "expense", date: { $gte: start, $lte: end } })
        .sort({ amount: -1 })
        .limit(8)
        .populate("categoryId", "name")
        .lean(),
    ]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const expenseTotal = expenseByCategory.reduce((s, c) => s + c.amount, 0);
  const incomeTotal = incomeTotalAgg[0]?.total ?? 0;

  return {
    period: { start: start.toISOString(), end: end.toISOString() },
    accounts: accounts.map((a) => ({ name: a.name, type: a.type, balance: fromCents(a.balance) })),
    totalBalance: fromCents(totalBalance),
    spendingByCategory: expenseByCategory.map((c) => ({
      category: c.cat[0]?.name ?? "Uncategorized",
      amount: fromCents(c.amount),
    })),
    incomeTotal: fromCents(incomeTotal),
    expenseTotal: fromCents(expenseTotal),
    previousPeriodExpenseTotal: fromCents(prevExpenseAgg[0]?.total ?? 0),
    budgets: budgets.map((b) => ({
      category: (b.category as unknown as { name: string })?.name ?? "Unknown",
      budgeted: fromCents(b.budgeted),
      spent: fromCents(b.spent),
      percentUsed: b.percentUsed,
    })),
    savingsGoals: goals.map((g) => {
      const monthsLeft = g.targetDate
        ? Math.max(1, Math.round((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        : undefined;
      const remaining = g.targetAmount - g.currentAmount;
      return {
        name: g.name,
        targetAmount: fromCents(g.targetAmount),
        currentAmount: fromCents(g.currentAmount),
        targetDate: g.targetDate ? new Date(g.targetDate).toISOString() : undefined,
        monthlyContributionNeeded: monthsLeft ? fromCents(Math.max(0, remaining) / monthsLeft) : undefined,
      };
    }),
    recentLargeTransactions: largeTx.map((t) => ({
      date: t.date.toISOString(),
      category: (t.categoryId as unknown as { name: string })?.name ?? "Uncategorized",
      amount: fromCents(t.amount),
      note: t.note,
    })),
  };
}

function hashContext(context: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex");
}

const SYSTEM_PROMPT = `You are a personal finance analyst assistant embedded in a budgeting app. You are given a JSON digest of one person's accounts, spending, budgets, and savings goals for the current month. Be concise and reference actual numbers from the data provided. Avoid generic boilerplate advice. Do not give regulated investment or tax advice. Produce 3-6 insights spanning: spending pattern callouts, budget adherence flags, savings goal feasibility (based on actual income minus expense cash flow), and 1-2 personalized suggestions.`;

export async function generateInsight() {
  await connectDB();

  const context = await buildContext();
  const contextHash = hashContext(context);

  const latest = await AIInsight.findOne().sort({ generatedAt: -1 }).lean();
  if (latest && latest.contextHash === contextHash) {
    const ageHours = (Date.now() - new Date(latest.generatedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < CACHE_TTL_HOURS) {
      return latest;
    }
  }

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this financial data and respond with ONLY a JSON object matching this shape: {"summary": string, "insights": [{"type": "spending_pattern"|"budget_adherence"|"savings_feasibility"|"suggestion", "title": string, "body": string, "severity": "info"|"warning"|"positive"}]}.\n\nData:\n${JSON.stringify(context)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI did not return a response");
  }

  const parsed = insightSchema.parse(JSON.parse(content));

  const { start, end } = monthRange(monthKey());
  const created = await AIInsight.create({
    generatedAt: new Date(),
    periodStart: start,
    periodEnd: end,
    model: AI_MODEL,
    summary: parsed.summary,
    insights: parsed.insights,
    contextHash,
    tokenUsage: {
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    },
  });

  const allIds = await AIInsight.find().sort({ generatedAt: -1 }).select("_id").lean();
  if (allIds.length > MAX_STORED_INSIGHTS) {
    const idsToRemove = allIds.slice(MAX_STORED_INSIGHTS).map((d) => d._id);
    await AIInsight.deleteMany({ _id: { $in: idsToRemove } });
  }

  return created.toObject();
}

export async function listInsights(limit = 20) {
  await connectDB();
  return AIInsight.find().sort({ generatedAt: -1 }).limit(limit).lean();
}
