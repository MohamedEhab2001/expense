import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().trim().min(1).max(60),
  targetAmount: z.number().int().positive(),
  targetDate: z.coerce.date().optional(),
  linkedAccountId: z.string().min(1).optional(),
  icon: z.string().default("target"),
  color: z.string().default("#34D399"),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const contributeGoalSchema = z.object({
  amount: z.number().int().positive(),
});
