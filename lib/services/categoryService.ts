import mongoose from "mongoose";
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

// Throws unless `parentId` can hold `categoryId` as a child: parents are top-level categories
// of the same kind, and a category that has children of its own can't become a child.
async function assertValidParent(parentId: string, kind: string, categoryId?: string) {
  if (categoryId && parentId === categoryId) throw new Error("A category can't be its own parent");
  const parent = await Category.findById(parentId).lean();
  if (!parent || parent.isArchived) throw new Error("Parent category not found");
  if (parent.parentId) throw new Error("Subcategories can't have their own subcategories");
  if (parent.kind !== kind) throw new Error("Parent must be the same kind (expense or income)");
  if (categoryId && (await Category.exists({ parentId: categoryId, isArchived: false }))) {
    throw new Error("Move this category's subcategories out first");
  }
}

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  await connectDB();
  if (input.parentId) await assertValidParent(input.parentId, input.kind);
  const count = await Category.countDocuments({ kind: input.kind });
  return Category.create({ ...input, parentId: input.parentId ?? null, order: count });
}

export async function updateCategory(id: string, input: z.infer<typeof updateCategorySchema>) {
  await connectDB();
  const existing = await Category.findById(id).lean();
  if (!existing) throw new Error("Category not found");

  const kind = input.kind ?? existing.kind;
  const parentId = input.parentId === undefined ? existing.parentId && String(existing.parentId) : input.parentId;
  if (parentId) await assertValidParent(parentId, kind, id);
  if (input.kind && input.kind !== existing.kind && (await Category.exists({ parentId: id }))) {
    throw new Error("Can't change the kind of a category that has subcategories");
  }

  return Category.findByIdAndUpdate(id, input, { new: true }).lean();
}

// Archiving a parent promotes its subcategories to top-level so they stay usable.
export async function archiveCategory(id: string) {
  await connectDB();
  await Category.updateMany({ parentId: id }, { parentId: null });
  return Category.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
}

// The category plus its subcategories, for queries that roll a parent up.
export async function categoryWithChildrenIds(id: string) {
  await connectDB();
  const children = await Category.find({ parentId: id }).distinct("_id");
  return [new mongoose.Types.ObjectId(id), ...children];
}
