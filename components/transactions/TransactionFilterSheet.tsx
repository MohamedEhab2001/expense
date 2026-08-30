"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, useCategories } from "@/lib/queries";
import type { TransactionFilters } from "@/lib/types";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
  { value: "atm_withdrawal", label: "ATM withdrawal" },
];

export function TransactionFilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  function set<K extends keyof TransactionFilters>(key: K, value: string) {
    onChange({ ...filters, [key]: value === "all" || value === "" ? undefined : value });
  }

  function clear() {
    onChange({});
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filter activity</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={filters.type ?? "all"} onValueChange={(v) => set("type", v ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Account</Label>
            <Select value={filters.accountId ?? "all"} onValueChange={(v) => set("accountId", v ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts?.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={filters.categoryId ?? "all"} onValueChange={(v) => set("categoryId", v ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-from">From</Label>
              <Input
                id="filter-from"
                type="date"
                value={filters.from ?? ""}
                onChange={(e) => set("from", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-to">To</Label>
              <Input
                id="filter-to"
                type="date"
                value={filters.to ?? ""}
                onChange={(e) => set("to", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={clear}>
              Clear
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
