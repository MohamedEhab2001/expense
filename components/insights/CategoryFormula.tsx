"use client";

import { useEffect, useState } from "react";
import { Delete, Equal, Minus, Plus } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import { groupCategories } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";
import type { CategoryBreakdownItemDTO, CategoryDTO } from "@/lib/types";

type Op = "+" | "-";
type Term = { op: Op; categoryId: string };
// `level` picks which categories are listed to add; terms already added keep their own level.
type Level = "groups" | "subcategories";
type Formula = { terms: Term[]; pendingOp: Op | null; showResult: boolean; level: Level };

const FORMULA_KEY = "insights-category-formula";
const EMPTY: Formula = { terms: [], pendingOp: null, showResult: false, level: "groups" };

function loadFormula(): Formula | null {
  try {
    const stored = localStorage.getItem(FORMULA_KEY);
    return stored ? { ...EMPTY, ...JSON.parse(stored) } : null;
  } catch {
    return null;
  }
}

function saveFormula(formula: Formula) {
  try {
    localStorage.setItem(FORMULA_KEY, JSON.stringify(formula));
  } catch {
    // Storage can be unavailable (e.g. private mode); the formula just won't persist.
  }
}

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

function ChipRow({
  categories,
  totals,
  disabled,
  onPick,
}: {
  categories: CategoryDTO[];
  totals: Map<string, number>;
  disabled: boolean;
  onPick: (categoryId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() => onPick(c._id)}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-all active:scale-95"
        >
          <span style={{ color: c.color }}>
            <DynamicIcon name={c.icon} className="size-3.5" />
          </span>
          {c.name}
          <span className="tabular-nums text-xs opacity-70">{formatCents(totals.get(c._id) ?? 0)}</span>
        </button>
      ))}
    </div>
  );
}

// Builds expressions like "Food + Transport − Rent" from category totals; "=" evaluates them.
export function CategoryFormula({
  data: items,
  categories,
}: {
  data: CategoryBreakdownItemDTO[];
  categories: CategoryDTO[];
}) {
  // pendingOp is the operator chosen for the next term, set after a category has been added.
  const [formula, setFormula] = useState<Formula>(EMPTY);
  const { terms, pendingOp, showResult, level } = formula;

  // Restore after mount to avoid a server/client hydration mismatch.
  useEffect(() => {
    const stored = loadFormula();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external system, on mount
    if (stored) setFormula(stored);
  }, []);

  function update(next: Formula) {
    setFormula(next);
    saveFormula(next);
  }

  const totals = categoryTotals(items, categories);
  const spentIds = new Set(totals.keys());
  const choices = categories.filter((c) => c.kind === "expense" && (!c.isArchived || spentIds.has(c._id)));
  const groups = groupCategories(choices);
  const hasSubcategories = groups.some((g) => g.children.length > 0);
  const standalone = groups.filter((g) => g.children.length === 0).map((g) => g.category);
  const parents = groups.filter((g) => g.children.length > 0);
  const byId = new Map(categories.map((c) => [c._id, c]));

  const awaitingCategory = terms.length === 0 || pendingOp !== null;
  const result = terms.reduce((sum, t) => sum + (t.op === "+" ? 1 : -1) * (totals.get(t.categoryId) ?? 0), 0);

  function addCategory(categoryId: string) {
    if (!awaitingCategory) return;
    update({ ...formula, terms: [...terms, { op: pendingOp ?? "+", categoryId }], pendingOp: null, showResult: false });
  }

  function chooseOp(op: Op) {
    if (terms.length === 0) return;
    update({ ...formula, pendingOp: op, showResult: false });
  }

  function backspace() {
    update({ ...formula, terms: pendingOp ? terms : terms.slice(0, -1), pendingOp: null, showResult: false });
  }

  function clear() {
    update({ ...EMPTY, level });
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
          onClick={() => update({ ...formula, showResult: true })}
          disabled={!canEvaluate}
          aria-label="Equals"
          className="flex items-center justify-center rounded-lg bg-primary py-2 text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          <Equal className="size-4" />
        </button>
      </div>

      {hasSubcategories && (
        <div className="flex self-end rounded-full border border-border p-0.5 text-xs">
          {(
            [
              { value: "groups", label: "Groups" },
              { value: "subcategories", label: "Subcategories" },
            ] as const
          ).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => update({ ...formula, level: o.value })}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                level === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className={cn("flex flex-col gap-3 transition-opacity", !awaitingCategory && "opacity-40")}>
        {level === "groups" || !hasSubcategories ? (
          <ChipRow categories={groups.map((g) => g.category)} totals={totals} disabled={!awaitingCategory} onPick={addCategory} />
        ) : (
          <>
            {standalone.length > 0 && (
              <ChipRow categories={standalone} totals={totals} disabled={!awaitingCategory} onPick={addCategory} />
            )}
            {parents.map(({ category, children }) => (
              <div key={category._id} className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">{category.name}</p>
                <ChipRow categories={children} totals={totals} disabled={!awaitingCategory} onPick={addCategory} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
