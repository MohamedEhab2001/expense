import { z } from "zod";
import { accountCurrencySchema } from "@/lib/validation/account";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  amount: z.number().int().positive(),
  currency: accountCurrencySchema.default(DEFAULT_CURRENCY),
  // 1 unit of `currency` = exchangeRate EGP. Ignored (treated as 1) when currency is EGP.
  exchangeRate: z.number().positive().default(1),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  billingDay: z.number().int().min(1).max(31).default(1),
  icon: z.string().default("receipt"),
  color: z.string().default("#A78BFA"),
  isActive: z.boolean().default(true),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
