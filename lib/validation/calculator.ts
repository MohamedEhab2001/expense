import { z } from "zod";
import { accountCurrencySchema } from "@/lib/validation/account";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";

export const calculatorInputSchema = z.object({
  amount: z.number().positive(),
  currency: accountCurrencySchema.default(DEFAULT_CURRENCY),
  isRecurring: z.boolean().default(false),
  note: z.string().trim().max(80).optional(),
  months: z.number().int().min(1).max(24).default(6),
});

export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
