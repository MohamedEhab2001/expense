"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Tags, Pencil, Archive } from "lucide-react";
import { fetcher, postJSON } from "@/lib/fetcher";
import { getIcon } from "@/lib/icon-map";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryForm } from "@/components/categories/CategoryForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { CategoryDTO } from "@/lib/types";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { data: categories, mutate, isLoading } = useSWR<CategoryDTO[]>("/api/categories", fetcher);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | undefined>(undefined);

  const expense = categories?.filter((c) => c.kind === "expense") ?? [];
  const income = categories?.filter((c) => c.kind === "income") ?? [];

  async function archive(id: string) {
    try {
      await postJSON(`/api/categories/${id}`, {}, "DELETE");
      toast.success("Category archived");
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function Group({ title, items }: { title: string; items: CategoryDTO[] }) {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((cat) => {
            const Icon = getIcon(cat.icon);
            return (
              <div
                key={cat._id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${cat.color}26`, color: cat.color }}
                >
                  <Icon className="size-4" />
                </div>
                <p className="flex-1 truncate text-sm font-medium">{cat.name}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
                    <MoreVertical className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(cat);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => archive(cat._id)}>
                      <Archive className="size-4" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {!isLoading && categories?.length === 0 && (
        <EmptyState icon={Tags} title="No categories" description="Add your first category to get started." />
      )}

      <Group title="Expense" items={expense} />
      <Group title="Income" items={income} />

      <CategoryForm
        key={editing?._id ?? "new"}
        category={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => mutate()}
      />
    </div>
  );
}
