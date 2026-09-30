"use client";

import { MoreHorizontal, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/lib/i18n";
import { useFinance } from "@/components/providers/finance-provider";

export function RowActions({
  label,
  onEdit,
  onDelete,
  extra = [],
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  /** Additional actions shown between Edit and Delete. */
  extra?: { label: string; icon: LucideIcon; onSelect: () => void }[];
}) {
  // View-only household members can't change anything, so there's nothing to offer.
  if (useFinance().readOnly) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("Actions for {name}", { name: label })} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onEdit} className="gap-2">
          <Pencil className="size-3.5" /> {t("Edit")}
        </DropdownMenuItem>
        {extra.map((x) => (
          <DropdownMenuItem key={x.label} onSelect={x.onSelect} className="gap-2">
            <x.icon className="size-3.5" /> {x.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete} className="gap-2">
          <Trash2 className="size-3.5" /> {t("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
