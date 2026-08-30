import { NextRequest, NextResponse } from "next/server";
import { getMonthlyBudgetStatus, upsertBudget, listUnbudgetedCategories } from "@/lib/services/budgetService";
import { upsertBudgetSchema } from "@/lib/validation/budget";
import { monthKey } from "@/lib/utils/dates";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") ?? monthKey();
  const [budgets, unbudgeted] = await Promise.all([
    getMonthlyBudgetStatus(month),
    listUnbudgetedCategories(),
  ]);
  return NextResponse.json({ month, budgets, unbudgetedCategories: unbudgeted });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = upsertBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const budget = await upsertBudget(parsed.data);
  return NextResponse.json(budget, { status: 201 });
}
