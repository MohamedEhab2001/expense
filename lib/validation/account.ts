import { z } from "zod";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/utils/currency";

export const accountTypeSchema = z.enum(["cash", "bank", "credit_card", "savings", "other"]);

const currencyCodes = CURRENCY_OPTIONS.map((c) => c.code) as [string, ...string[]];
export const accountCurrencySchema = z.enum(currencyCodes);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: accountTypeSchema,
  currency: accountCurrencySchema.default(DEFAULT_CURRENCY),
  balance: z.number().int().default(0),
  creditLimit: z.number().int().positive().optional(),
  statementDay: z.number().int().min(1).max(31).default(25),
  icon: z.string().default("wallet"),
  color: z.string().default("#34D399"),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
  order: z.number().int().optional(),
});
