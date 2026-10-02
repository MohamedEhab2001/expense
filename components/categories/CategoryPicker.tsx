"use client";

import { DynamicIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import { groupCategories } from "@/lib/utils/categories";
import type { CategoryDTO } from "@/lib/types";

function Chip({ category, active, onClick }: { category: CategoryDTO; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all active:scale-95",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
      )}
    >
      <DynamicIcon name={category.icon} className="size-3.5" />
      {category.name}
    </button>
  );
}

// Standalone categories as one row of chips, then each parent with its subcategories.
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: CategoryDTO[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const groups = groupCategories(categories);
  const standalone = groups.filter((g) => g.children.length === 0);
  const parents = groups.filter((g) => g.children.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {standalone.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {standalone.map(({ category }) => (
            <Chip key={category._id} category={category} active={value === category._id} onClick={() => onChange(category._id)} />
          ))}
        </div>
      )}
      {parents.map(({ category, children }) => (
        <div key={category._id} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{category.name}</p>
          <div className="flex flex-wrap gap-2">
            <Chip category={category} active={value === category._id} onClick={() => onChange(category._id)} />
            {children.map((child) => (
              <Chip key={child._id} category={child} active={value === child._id} onClick={() => onChange(child._id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
