import { z } from "zod";

const base = {
  amount: z.number().int().positive(),
  accountId: z.string().min(1),
  date: z.coerce.date().default(() => new Date()),
  note: z.string().trim().max(200).optional(),
  merchant: z.string().trim().max(100).optional(),
};

export const createTransactionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("expense"), categoryId: z.string().min(1), ...base }),
  z.object({ type: z.literal("income"), categoryId: z.string().min(1), ...base }),
  z.object({ type: z.literal("transfer"), linkedAccountId: z.string().min(1), ...base }),
  z.object({ type: z.literal("atm_withdrawal"), linkedAccountId: z.string().min(1), ...base }),
]);

export const updateTransactionSchema = createTransactionSchema;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
