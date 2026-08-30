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
