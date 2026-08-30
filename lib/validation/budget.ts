import { z } from "zod";

export const upsertBudgetSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().int().min(0),
  rollover: z.boolean().default(false),
});
