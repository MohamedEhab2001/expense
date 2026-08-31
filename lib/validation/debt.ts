import { z } from "zod";

const debtBase = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(["installment", "debt", "credit_card"]),
  paymentSchedule: z.enum(["monthly", "one_time"]).default("monthly"),
  totalAmount: z.number().int().positive().optional(),
  remainingAmount: z.number().int().min(0),
  monthlyPayment: z.number().int().positive().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  linkedAccountId: z.string().min(1).optional(),
  icon: z.string().default("credit-card"),
  color: z.string().default("#F87171"),
});

function requireMonthlySchedule<T extends { paymentSchedule: string; monthlyPayment?: number; dueDay?: number }>(
  data: T,
  ctx: z.RefinementCtx
) {
  if (data.paymentSchedule === "monthly") {
    if (!data.monthlyPayment) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["monthlyPayment"], message: "Monthly payment is required" });
    }
    if (!data.dueDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDay"], message: "Due day is required" });
    }
  }
}

export const createDebtSchema = debtBase.superRefine(requireMonthlySchedule);

export const updateDebtSchema = debtBase
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
    isPaidOff: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentSchedule) requireMonthlySchedule(data as { paymentSchedule: string; monthlyPayment?: number; dueDay?: number }, ctx);
  });

export const payDebtSchema = z.object({
  amount: z.number().int().positive().optional(),
});
