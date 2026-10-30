"use client";

import { useState } from "react";
import { Delete, Equal, Minus, Plus } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import { groupCategories } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";
import type { CategoryBreakdownItemDTO, CategoryDTO } from "@/lib/types";

type Op = "+" | "-";
type Term = { op: Op; categoryId: string };

// Spending per category for the period; a parent's total includes its subcategories.
function categoryTotals(items: CategoryBreakdownItemDTO[], categories: CategoryDTO[]) {
  const byId = new Map(categories.map((c) => [c._id, c]));
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.categoryId, (totals.get(item.categoryId) ?? 0) + item.amount);
    const parentId = item.parentId ?? byId.get(item.categoryId)?.parentId;
    if (parentId && parentId !== item.categoryId) totals.set(parentId, (totals.get(parentId) ?? 0) + item.amount);
  }
  return totals;
}

// Builds expressions like "Food + Transport − Rent" from category totals; "=" evaluates them.
export function CategoryFormula({
  data: items,
  categories,
}: {
  data: CategoryBreakdownItemDTO[];
  categories: CategoryDTO[];
}) {
  const [terms, setTerms] = useState<Term[]>([]);
  // The operator chosen for the next term, set after a category has been added.
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [showResult, setShowResult] = useState(false);

  const totals = categoryTotals(items, categories);
  const spentIds = new Set(totals.keys());
  const choices = categories.filter((c) => c.kind === "expense" && (!c.isArchived || spentIds.has(c._id)));
  const groups = groupCategories(choices);
  const byId = new Map(categories.map((c) => [c._id, c]));

  const awaitingCategory = terms.length === 0 || pendingOp !== null;
  const result = terms.reduce((sum, t) => sum + (t.op === "+" ? 1 : -1) * (totals.get(t.categoryId) ?? 0), 0);

  function addCategory(categoryId: string) {
    if (!awaitingCategory) return;
    setTerms((ts) => [...ts, { op: pendingOp ?? "+", categoryId }]);
    setPendingOp(null);
    setShowResult(false);
  }

  function chooseOp(op: Op) {
    if (terms.length === 0) return;
    setPendingOp(op);
    setShowResult(false);
  }

  function backspace() {
    if (pendingOp) setPendingOp(null);
    else setTerms((ts) => ts.slice(0, -1));
    setShowResult(false);
  }

  function clear() {
    setTerms([]);
    setPendingOp(null);
    setShowResult(false);
  }

  const canEvaluate = terms.length > 0 && pendingOp === null;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex min-h-16 flex-col justify-end gap-1 rounded-lg bg-secondary/50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          {terms.length === 0 ? (
            <span className="text-muted-foreground">Tap a category to start</span>
          ) : (
            terms.map((t, i) => {
              const category = byId.get(t.categoryId);
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {(i > 0 || t.op === "-") && (
                    <span className="font-semibold text-muted-foreground">{t.op === "+" ? "+" : "−"}</span>
                  )}
                  <span className="flex items-center gap-1 font-medium" style={{ color: category?.color }}>
                    {category && <DynamicIcon name={category.icon} className="size-3.5" />}
                    {category?.name ?? "Unknown"}
                  </span>
                </span>
              );
            })
          )}
          {pendingOp && <span className="font-semibold text-muted-foreground">{pendingOp === "+" ? "+" : "−"}</span>}
        </div>
        {showResult && (
          <p className={cn("text-right text-2xl font-semibold tabular-nums", result < 0 && "text-destructive")}>
            = {result < 0 ? "−" : ""}
            {formatCents(Math.abs(result))}
          </p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={terms.length === 0}
          className="rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          C
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={terms.length === 0}
          aria-label="Remove last"
          className="flex items-center justify-center rounded-lg border border-border py-2 text-muted-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          <Delete className="size-4" />
        </button>
        {(["+", "-"] as const).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => chooseOp(op)}
            disabled={terms.length === 0}
            aria-label={op === "+" ? "Plus" : "Minus"}
            className={cn(
              "flex items-center justify-center rounded-lg border py-2 transition-all active:scale-95 disabled:opacity-40",
              pendingOp === op ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
            )}
          >
            {op === "+" ? <Plus className="size-4" /> : <Minus className="size-4" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowResult(true)}
          disabled={!canEvaluate}
          aria-label="Equals"
          className="flex items-center justify-center rounded-lg bg-primary py-2 text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          <Equal className="size-4" />
        </button>
      </div>

      <div className={cn("flex flex-col gap-3 transition-opacity", !awaitingCategory && "opacity-40")}>
        {groups.map(({ category, children }) => (
          <div key={category._id} className="flex flex-wrap gap-2">
            {[category, ...children].map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => addCategory(c._id)}
                disabled={!awaitingCategory}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-all active:scale-95",
                  c === category && children.length > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <span style={{ color: c.color }}>
                  <DynamicIcon name={c.icon} className="size-3.5" />
                </span>
                {c.name}
                <span className="tabular-nums text-xs opacity-70">{formatCents(totals.get(c._id) ?? 0)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
