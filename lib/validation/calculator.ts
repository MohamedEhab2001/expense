import { z } from "zod";

const categoryPlanItemSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().min(0),
});

const transferItemSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
    amount: z.number().positive(),
  })
  .refine((t) => t.fromAccountId !== t.toAccountId, { message: "From and to accounts must differ" });

export const calculatorInputSchema = z.object({
  payFromAccountId: z.string().min(1),
  categoryPlan: z.array(categoryPlanItemSchema).default([]),
  transfers: z.array(transferItemSchema).default([]),
  purchaseAmount: z.number().positive(),
  isRecurring: z.boolean().default(false),
  note: z.string().trim().max(80).optional(),
});

export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
