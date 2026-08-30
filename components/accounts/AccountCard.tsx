"use client";

import { MoreVertical, Pencil, Archive } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
import { formatCents } from "@/lib/utils/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AccountDTO } from "@/lib/types";

export function AccountCard({
  account,
  onEdit,
  onArchive,
}: {
  account: AccountDTO;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const Icon = getIcon(account.icon);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${account.color}26`, color: account.color }}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{account.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{account.type.replace("_", " ")}</p>
      </div>
      <p className="tabular-nums font-semibold">{formatCents(account.balance, account.currency)}</p>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onArchive}>
            <Archive className="size-4" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
