import { z } from "zod";

const fields = {
  name: z.string().trim().min(1).max(40),
  kind: z.enum(["expense", "income"]),
  icon: z.string(),
  color: z.string(),
  // null makes the category top-level.
  parentId: z.string().min(1).nullable(),
};

export const createCategorySchema = z.object({
  ...fields,
  icon: fields.icon.default("tag"),
  color: fields.color.default("#34D399"),
  parentId: fields.parentId.optional(),
});

// No defaults here: a partial update (e.g. only moving a category) must not reset other fields.
export const updateCategorySchema = z
  .object(fields)
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
    order: z.number().int().optional(),
  });
