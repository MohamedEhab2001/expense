import { z } from "zod";

export const accountTypeSchema = z.enum(["cash", "bank", "credit_card", "savings", "other"]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: accountTypeSchema,
  currency: z.string().trim().length(3).default("USD"),
  balance: z.number().int().default(0),
  icon: z.string().default("wallet"),
  color: z.string().default("#34D399"),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
  order: z.number().int().optional(),
});
