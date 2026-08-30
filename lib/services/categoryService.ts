import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import type { z } from "zod";
import type { createCategorySchema, updateCategorySchema } from "@/lib/validation/category";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "utensils", color: "#F59E0B" },
  { name: "Transport", icon: "car", color: "#60A5FA" },
  { name: "Housing", icon: "home", color: "#A78BFA" },
  { name: "Utilities", icon: "plug", color: "#38BDF8" },
  { name: "Entertainment", icon: "clapperboard", color: "#F472B6" },
  { name: "Health", icon: "heart-pulse", color: "#FB7185" },
  { name: "Shopping", icon: "shopping-bag", color: "#34D399" },
  { name: "Other", icon: "more-horizontal", color: "#94A3B8" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "briefcase", color: "#34D399" },
  { name: "Freelance", icon: "laptop", color: "#60A5FA" },
  { name: "Other", icon: "more-horizontal", color: "#94A3B8" },
];

export async function listCategories(includeArchived = false) {
  await connectDB();
  await seedDefaultsIfEmpty();
  const filter = includeArchived ? {} : { isArchived: false };
  return Category.find(filter).sort({ kind: 1, order: 1 }).lean();
}

async function seedDefaultsIfEmpty() {
  const count = await Category.countDocuments();
  if (count > 0) return;

  const docs = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, kind: "expense", order: i })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, kind: "income", order: i })),
  ];
  await Category.insertMany(docs);
}

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  await connectDB();
  const count = await Category.countDocuments({ kind: input.kind });
  return Category.create({ ...input, order: count });
}

export async function updateCategory(id: string, input: z.infer<typeof updateCategorySchema>) {
  await connectDB();
  return Category.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function archiveCategory(id: string) {
  await connectDB();
  return Category.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}
