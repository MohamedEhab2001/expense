import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import "@/models/Category";
import Transaction, { type Transaction as TransactionDoc } from "@/models/Transaction";
import type { CreateTransactionInput } from "@/lib/validation/transaction";

type EffectInput = Pick<TransactionDoc, "type" | "amount" | "accountId" | "linkedAccountId">;

async function applyBalanceEffect(
  session: mongoose.ClientSession,
  tx: EffectInput,
  sign: 1 | -1
) {
  const delta = tx.amount * sign;

  if (tx.type === "expense") {
    await Account.updateOne({ _id: tx.accountId }, { $inc: { balance: -delta } }, { session });
  } else if (tx.type === "income") {
    await Account.updateOne({ _id: tx.accountId }, { $inc: { balance: delta } }, { session });
  } else {
    // transfer | atm_withdrawal
    await Account.updateOne({ _id: tx.accountId }, { $inc: { balance: -delta } }, { session });
    await Account.updateOne(
      { _id: tx.linkedAccountId },
      { $inc: { balance: delta } },
      { session }
    );
  }
}

export async function listTransactions(params: {
  accountId?: string;
  categoryId?: string;
  type?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (params.accountId) {
    filter.$or = [{ accountId: params.accountId }, { linkedAccountId: params.accountId }];
  }
  if (params.categoryId) filter.categoryId = params.categoryId;
  if (params.type) filter.type = params.type;
  if (params.from || params.to) {
    filter.date = {
      ...(params.from ? { $gte: params.from } : {}),
      ...(params.to ? { $lte: params.to } : {}),
    };
  }
  if (params.cursor) filter._id = { $lt: params.cursor };

  const limit = Math.min(params.limit ?? 30, 100);

  return Transaction.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(limit)
    .populate("accountId", "name icon color")
    .populate("linkedAccountId", "name icon color")
    .populate("categoryId", "name icon color")
    .lean();
}

export async function createTransaction(input: CreateTransactionInput) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let created: TransactionDoc | null = null;
    await session.withTransaction(async () => {
      const [doc] = await Transaction.create([input], { session });
      created = doc.toObject();
      await applyBalanceEffect(session, doc, 1);
    });
    return created;
  } finally {
    await session.endSession();
  }
}

export async function updateTransaction(id: string, input: CreateTransactionInput) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let updated: TransactionDoc | null = null;
    await session.withTransaction(async () => {
      const existing = await Transaction.findById(id).session(session);
      if (!existing) throw new Error("Transaction not found");

      await applyBalanceEffect(session, existing, -1);
      existing.set(input);
      await existing.save({ session });
      await applyBalanceEffect(session, existing, 1);
      updated = existing.toObject();
    });
    return updated;
  } finally {
    await session.endSession();
  }
}

export async function deleteTransaction(id: string) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const existing = await Transaction.findById(id).session(session);
      if (!existing) throw new Error("Transaction not found");
      await applyBalanceEffect(session, existing, -1);
      await existing.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }
}
