"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPicker, ColorPicker } from "@/components/shared/IconColorPicker";
import { CATEGORY_ICON_OPTIONS } from "@/lib/icon-map";
import { postJSON } from "@/lib/fetcher";
import type { CategoryDTO, CategoryKind } from "@/lib/types";
import { toast } from "sonner";

const NO_PARENT = "none";

export function CategoryForm({
  category,
  categories,
  defaultParentId,
  open,
  onOpenChange,
  onSaved,
}: {
  category?: CategoryDTO;
  /** All categories, to offer as parents. */
  categories: CategoryDTO[];
  /** Preselected parent when adding a subcategory. */
  defaultParentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const defaultParent = categories.find((c) => c._id === defaultParentId);
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? defaultParent?.kind ?? "expense");
  const [parentId, setParentId] = useState(category?.parentId ?? defaultParentId ?? NO_PARENT);
  const [icon, setIcon] = useState(category?.icon ?? "utensils");
  const [color, setColor] = useState(category?.color ?? "#34D399");
  const [saving, setSaving] = useState(false);

  // A parent must be a top-level category of the same kind; a category with subcategories of
  // its own stays top-level.
  const hasChildren = !!category && categories.some((c) => c.parentId === category._id);
  const parentOptions = categories.filter((c) => c.kind === kind && !c.parentId && c._id !== category?._id);
  const parentItems = {
    [NO_PARENT]: "None (top-level)",
    ...Object.fromEntries(parentOptions.map((c) => [c._id, c.name])),
  };
  const effectiveParentId = parentOptions.some((c) => c._id === parentId) ? parentId : NO_PARENT;

  async function submit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        kind,
        icon,
        color,
        parentId: effectiveParentId === NO_PARENT ? null : effectiveParentId,
      };
      if (isEdit) {
        await postJSON(`/api/categories/${category._id}`, payload, "PATCH");
      } else {
        await postJSON("/api/categories", payload);
      }
      toast.success(isEdit ? "Category updated" : "Category added");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Groceries" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Kind</Label>
            <Tabs value={kind} onValueChange={(v) => setKind(v as CategoryKind)}>
              <TabsList className="w-full">
                <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
                <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!hasChildren && (
            <div className="flex flex-col gap-1.5">
              <Label>Parent category</Label>
              <Select items={parentItems} value={effectiveParentId} onValueChange={(v) => setParentId(v ?? NO_PARENT)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>{parentItems[NO_PARENT]}</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Icon</Label>
            <IconPicker options={CATEGORY_ICON_OPTIONS} value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
