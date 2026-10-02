import type { CategoryDTO } from "@/lib/types";

export interface CategoryGroup {
  category: CategoryDTO;
  children: CategoryDTO[];
}

// Top-level categories in display order, each with its subcategories. A subcategory whose parent
// isn't in `categories` (e.g. archived or filtered out) is shown as top-level.
export function groupCategories(categories: CategoryDTO[]): CategoryGroup[] {
  const ids = new Set(categories.map((c) => c._id));
  const groups = categories
    .filter((c) => !c.parentId || !ids.has(c.parentId))
    .map((category) => ({ category, children: [] as CategoryDTO[] }));
  const byId = new Map(groups.map((g) => [g.category._id, g]));
  for (const c of categories) {
    if (c.parentId && ids.has(c.parentId)) byId.get(c.parentId)?.children.push(c);
  }
  return groups;
}

// Parent and subcategories flattened in display order, for <Select>s.
export function flattenGroups(groups: CategoryGroup[]): { category: CategoryDTO; depth: 0 | 1 }[] {
  return groups.flatMap((g) => [
    { category: g.category, depth: 0 as const },
    ...g.children.map((category) => ({ category, depth: 1 as const })),
  ]);
}
