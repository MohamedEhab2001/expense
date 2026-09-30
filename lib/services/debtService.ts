import { connectDB } from "@/lib/db";
import Debt, { type Debt as DebtDoc } from "@/models/Debt";
import "@/models/Account";
import { differenceInCalendarDays } from "date-fns";
import { appNow, dueDateInPeriod, monthKey } from "@/lib/utils/dates";
import { getCurrentPeriod } from "./cycleService";
import type { z } from "zod";
import type { createDebtSchema, updateDebtSchema } from "@/lib/validation/debt";

export type DebtStatus = "paid_off" | "paid" | "overdue" | "due_soon" | "upcoming";

// "Paid" and "due" are relative to the current home month (see cycleService), so a loan due on
// the 5th that was paid on the 28th, right after a payday on the 26th, counts as paid.
export function getDebtStatus(
  debt: Pick<DebtDoc, "isPaidOff" | "lastPaidMonth" | "lastPaidAt" | "dueDay" | "paymentSchedule">,
  periodStart: Date,
  now = appNow()
): DebtStatus {
  if (debt.isPaidOff) return "paid_off";
  if (debt.paymentSchedule === "one_time" || !debt.dueDay) return "upcoming";
  // Payments recorded before lastPaidAt existed only have the calendar month.
  const paidThisPeriod = debt.lastPaidAt
    ? debt.lastPaidAt >= periodStart
    : debt.lastPaidMonth === monthKey(now);
  if (paidThisPeriod) return "paid";
  const daysUntilDue = differenceInCalendarDays(dueDateInPeriod(debt.dueDay, periodStart), now);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 7) return "due_soon";
  return "upcoming";
}

// A linked debt follows its account's currency; `d.currency` is only the fallback.
function withEffectiveCurrency<T extends { currency?: string; linkedAccountId?: unknown }>(d: T) {
  const linked = d.linkedAccountId as { currency?: string } | undefined;
  return { ...d, currency: linked?.currency ?? d.currency ?? "EGP" };
}

export async function listDebts(includeArchived = false) {
  await connectDB();
  const filter = includeArchived ? {} : { isArchived: false };
  const [debts, period] = await Promise.all([
    Debt.find(filter).populate("linkedAccountId", "name currency").sort({ dueDay: 1 }).lean(),
    getCurrentPeriod(),
  ]);
  return debts.map((d) => ({ ...withEffectiveCurrency(d), status: getDebtStatus(d, period.start) }));
}

export async function getUpcomingDebts() {
  await connectDB();
  const [debts, period] = await Promise.all([
    Debt.find({ isArchived: false, isPaidOff: false }).populate("linkedAccountId", "name currency").lean(),
    getCurrentPeriod(),
  ]);
  return debts
    .map((d) => ({ ...withEffectiveCurrency(d), status: getDebtStatus(d, period.start) }))
    .filter((d) => d.status === "overdue" || d.status === "due_soon")
    .sort((a, b) => (a.status === "overdue" ? -1 : 1));
}

export async function createDebt(input: z.infer<typeof createDebtSchema>) {
  await connectDB();
  return Debt.create(input);
}

export async function updateDebt(id: string, input: z.infer<typeof updateDebtSchema>) {
  await connectDB();
  return Debt.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function archiveDebt(id: string) {
  await connectDB();
  return Debt.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}

export async function markDebtPaid(id: string, amount?: number) {
  await connectDB();
  const debt = await Debt.findById(id);
  if (!debt) throw new Error("Debt not found");

  if (debt.paymentSchedule === "one_time") {
    if (!amount || amount <= 0) throw new Error("Enter a payment amount");
    debt.remainingAmount = Math.max(0, debt.remainingAmount - amount);
  } else {
    const payment = amount ?? debt.monthlyPayment;
    if (!payment) throw new Error("Debt has no monthly payment set");
    debt.remainingAmount = Math.max(0, debt.remainingAmount - payment);
    debt.lastPaidMonth = monthKey();
    debt.lastPaidAt = appNow();
  }

  if (debt.remainingAmount <= 0) {
    debt.isPaidOff = true;
  }
  await debt.save();
  const period = await getCurrentPeriod();
  return { ...debt.toObject(), status: getDebtStatus(debt, period.start) };
}
