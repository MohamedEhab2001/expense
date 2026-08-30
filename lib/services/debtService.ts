import { connectDB } from "@/lib/db";
import Debt, { type Debt as DebtDoc } from "@/models/Debt";
import "@/models/Account";
import { monthKey } from "@/lib/utils/dates";
import type { z } from "zod";
import type { createDebtSchema, updateDebtSchema } from "@/lib/validation/debt";

export type DebtStatus = "paid_off" | "paid" | "overdue" | "due_soon" | "upcoming";

export function getDebtStatus(debt: Pick<DebtDoc, "isPaidOff" | "lastPaidMonth" | "dueDay">, now = new Date()): DebtStatus {
  if (debt.isPaidOff) return "paid_off";
  if (debt.lastPaidMonth === monthKey(now)) return "paid";
  const daysUntilDue = debt.dueDay - now.getDate();
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 7) return "due_soon";
  return "upcoming";
}

export async function listDebts(includeArchived = false) {
  await connectDB();
  const filter = includeArchived ? {} : { isArchived: false };
  const debts = await Debt.find(filter).populate("linkedAccountId", "name").sort({ dueDay: 1 }).lean();
  return debts.map((d) => ({ ...d, status: getDebtStatus(d) }));
}

export async function getUpcomingDebts() {
  await connectDB();
  const debts = await Debt.find({ isArchived: false, isPaidOff: false }).populate("linkedAccountId", "name").lean();
  return debts
    .map((d) => ({ ...d, status: getDebtStatus(d) }))
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

export async function markDebtPaid(id: string) {
  await connectDB();
  const debt = await Debt.findById(id);
  if (!debt) throw new Error("Debt not found");

  debt.remainingAmount = Math.max(0, debt.remainingAmount - debt.monthlyPayment);
  debt.lastPaidMonth = monthKey();
  if (debt.totalAmount && debt.remainingAmount <= 0) {
    debt.isPaidOff = true;
  }
  await debt.save();
  return { ...debt.toObject(), status: getDebtStatus(debt) };
}
