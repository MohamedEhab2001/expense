import { z } from "zod";

export const createDebtSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(["installment", "debt", "credit_card"]),
  totalAmount: z.number().int().positive().optional(),
  remainingAmount: z.number().int().min(0),
  monthlyPayment: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(31),
  linkedAccountId: z.string().min(1).optional(),
  icon: z.string().default("credit-card"),
  color: z.string().default("#F87171"),
});

export const updateDebtSchema = createDebtSchema.partial().extend({
  isArchived: z.boolean().optional(),
  isPaidOff: z.boolean().optional(),
});
