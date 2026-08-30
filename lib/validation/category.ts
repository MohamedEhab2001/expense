import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  kind: z.enum(["expense", "income"]),
  icon: z.string().default("tag"),
  color: z.string().default("#34D399"),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isArchived: z.boolean().optional(),
  order: z.number().int().optional(),
});
