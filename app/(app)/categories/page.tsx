"use client";

import { useState } from "react";
import { Plus, Tags, Pencil, Archive, FolderInput, FolderPlus, MoreVertical } from "lucide-react";
import { postJSON } from "@/lib/fetcher";
import { DynamicIcon } from "@/lib/icon-map";
import { groupCategories, type CategoryGroup } from "@/lib/utils/categories";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { MoveCategoryDialog } from "@/components/categories/MoveCategoryDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories, useInvalidate } from "@/lib/queries";
import type { CategoryDTO } from "@/lib/types";
import { toast } from "sonner";

type FormState = { open: boolean; category?: CategoryDTO; parentId?: string };

interface Actions {
  all: CategoryDTO[];
  edit: (cat: CategoryDTO) => void;
  addChild: (parent: CategoryDTO) => void;
  move: (cat: CategoryDTO) => void;
  archive: (cat: CategoryDTO) => void;
}

function CategoryMenu({ cat, isParent, actions }: { cat: CategoryDTO; isParent: boolean; actions: Actions }) {
  // A parent can't become a subcategory until its own subcategories are moved out.
  const canMove = !isParent && actions.all.some((c) => c.kind === cat.kind && !c.parentId && c._id !== cat._id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
        <MoreVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => actions.edit(cat)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        {!cat.parentId && (
          <DropdownMenuItem onClick={() => actions.addChild(cat)}>
            <FolderPlus className="size-4" /> Add subcategory
          </DropdownMenuItem>
        )}
        {canMove && (
          <DropdownMenuItem onClick={() => actions.move(cat)}>
            <FolderInput className="size-4" /> {cat.parentId ? "Move…" : "Move into a group…"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={() => actions.archive(cat)}>
          <Archive className="size-4" /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryIcon({ cat, size = "md" }: { cat: CategoryDTO; size?: "sm" | "md" }) {
  return (
    <div
      className={size === "sm" ? "flex size-7 shrink-0 items-center justify-center rounded-full" : "flex size-8 shrink-0 items-center justify-center rounded-full"}
      style={{ backgroundColor: `${cat.color}26`, color: cat.color }}
    >
      <DynamicIcon name={cat.icon} className={size === "sm" ? "size-3.5" : "size-4"} />
    </div>
  );
}

function Group({ title, groups, actions }: { title: string; groups: CategoryGroup[]; actions: Actions }) {
  if (groups.length === 0) return null;
  const parents = groups.filter((g) => g.children.length > 0);
  const standalone = groups.filter((g) => g.children.length === 0);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      {parents.map(({ category, children }) => (
        <div key={category._id} className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 p-3">
            <CategoryIcon cat={category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {children.length} subcategor{children.length === 1 ? "y" : "ies"}
              </p>
            </div>
            <CategoryMenu cat={category} isParent actions={actions} />
          </div>
          <div className="ml-7 flex flex-col border-l border-border pb-1.5 pl-3">
            {children.map((child) => (
              <div key={child._id} className="flex items-center gap-2 py-1.5 pr-3">
                <CategoryIcon cat={child} size="sm" />
                <p className="flex-1 truncate text-sm">{child.name}</p>
                <CategoryMenu cat={child} isParent={false} actions={actions} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {standalone.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {standalone.map(({ category }) => (
            <div key={category._id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
              <CategoryIcon cat={category} />
              <p className="flex-1 truncate text-sm font-medium">{category.name}</p>
              <CategoryMenu cat={category} isParent={false} actions={actions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const invalidate = useInvalidate();
  const [form, setForm] = useState<FormState>({ open: false });
  const [moving, setMoving] = useState<CategoryDTO | undefined>(undefined);

  const all = categories ?? [];
  const expense = groupCategories(all.filter((c) => c.kind === "expense"));
  const income = groupCategories(all.filter((c) => c.kind === "income"));

  async function archive(cat: CategoryDTO) {
    try {
      await postJSON(`/api/categories/${cat._id}`, {}, "DELETE");
      const hadChildren = all.some((c) => c.parentId === cat._id);
      toast.success(hadChildren ? "Category archived — its subcategories moved to top level" : "Category archived");
      invalidate.all();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const actions: Actions = {
    all,
    edit: (category) => setForm({ open: true, category }),
    addChild: (parent) => setForm({ open: true, parentId: parent._id }),
    move: setMoving,
    archive,
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Button size="sm" onClick={() => setForm({ open: true })}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && categories?.length === 0 && (
        <EmptyState icon={Tags} title="No categories" description="Add your first category to get started." />
      )}

      <Group title="Expense" groups={expense} actions={actions} />
      <Group title="Income" groups={income} actions={actions} />

      <CategoryForm
        key={form.category?._id ?? `new-${form.parentId ?? ""}`}
        category={form.category}
        categories={all}
        defaultParentId={form.parentId}
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        onSaved={() => invalidate.all()}
      />

      {moving && (
        <MoveCategoryDialog
          key={moving._id}
          category={moving}
          categories={all}
          open
          onOpenChange={(open) => !open && setMoving(undefined)}
          onMoved={() => invalidate.all()}
        />
      )}
    </div>
  );
}
