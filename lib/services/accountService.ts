import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import type { z } from "zod";
import type { createAccountSchema, updateAccountSchema } from "@/lib/validation/account";

export async function listAccounts(includeArchived = false) {
  await connectDB();
  const filter = includeArchived ? {} : { isArchived: false };
  return Account.find(filter).sort({ order: 1, createdAt: 1 }).lean();
}

export async function getAccount(id: string) {
  await connectDB();
  return Account.findById(id).lean();
}

export async function createAccount(input: z.infer<typeof createAccountSchema>) {
  await connectDB();
  const count = await Account.countDocuments();
  return Account.create({ ...input, order: count });
}

export async function updateAccount(id: string, input: z.infer<typeof updateAccountSchema>) {
  await connectDB();
  return Account.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function archiveAccount(id: string) {
  await connectDB();
  return Account.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}

export type CreditCardStatus = "overdue" | "due_soon" | "upcoming";

function getCreditCardStatus(statementDay: number, now = new Date()): CreditCardStatus {
  const daysUntilDue = statementDay - now.getDate();
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 7) return "due_soon";
  return "upcoming";
}

export async function getCreditCardAlerts() {
  await connectDB();
  const cards = await Account.find({
    type: "credit_card",
    isArchived: false,
    balance: { $lt: 0 },
  }).lean();

  return cards
    .map((c) => ({ ...c, status: getCreditCardStatus(c.statementDay ?? 25) }))
    .filter((c) => c.status === "overdue" || c.status === "due_soon")
    .sort((a, b) => (a.status === "overdue" ? -1 : 1));
}
