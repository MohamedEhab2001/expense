"use client";

import { useState } from "react";
import { Check, CornerUpLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DynamicIcon } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/lib/types";
import { toast } from "sonner";

// Moves a category under another top-level category, or back out to the top level.
export function MoveCategoryDialog({
  category,
  categories,
  open,
  onOpenChange,
  onMoved,
}: {
  category: CategoryDTO;
  categories: CategoryDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const parents = categories.filter((c) => c.kind === category.kind && !c.parentId && c._id !== category._id);
  const current = category.parentId ?? null;

  async function moveTo(parentId: string | null) {
    if (parentId === current) return onOpenChange(false);
    setSaving(true);
    try {
      await postJSON(`/api/categories/${category._id}`, { parentId }, "PATCH");
      const parentName = parents.find((p) => p._id === parentId)?.name;
      toast.success(parentName ? `Moved into ${parentName}` : "Moved to top level");
      onMoved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const options = [
    { id: null, name: "Top level", icon: null as string | null, color: undefined as string | undefined },
    ...parents.map((p) => ({ id: p._id as string | null, name: p.name, icon: p.icon, color: p.color })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move &ldquo;{category.name}&rdquo;</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto px-4 pb-4">
          {options.map((o) => {
            const selected = o.id === current;
            return (
              <button
                key={o.id ?? "top"}
                disabled={saving}
                onClick={() => moveTo(o.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2.5 text-left text-sm transition-colors active:bg-secondary",
                  selected && "bg-secondary"
                )}
              >
                <div
                  className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                  style={o.color ? { backgroundColor: `${o.color}26`, color: o.color } : undefined}
                >
                  {o.icon ? <DynamicIcon name={o.icon} className="size-4" /> : <CornerUpLeft className="size-4" />}
                </div>
                <span className="flex-1 font-medium">{o.name}</span>
                {selected && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
