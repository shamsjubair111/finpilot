"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

export interface TransactionFilterState {
  search: string;
  category: string;
  type: string;
  account: string;
}


export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: TransactionFilterState;
  onChange: (filters: TransactionFilterState) => void;
}) {
  const { accounts, categoriesFor } = useFinance();
  const ALL_CATEGORIES = Array.from(new Set([...categoriesFor("expense"), ...categoriesFor("income")]));
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("Search transactions...")}
          className="pl-8"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label={t("Search transactions")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v })}>
          <SelectTrigger className="w-full sm:w-36" aria-label={t("Filter by type")}>
            <SelectValue placeholder={t("Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All types")}</SelectItem>
            <SelectItem value="income">{t("Income")}</SelectItem>
            <SelectItem value="expense">{t("Expense")}</SelectItem>
            <SelectItem value="transfer">{t("Transfer")}</SelectItem>
          </SelectContent>
        </Select>

        {accounts.length > 0 && (
          <Select value={filters.account} onValueChange={(v) => onChange({ ...filters, account: v })}>
            <SelectTrigger className="w-full sm:w-44" aria-label={t("Filter by account")}>
              <SelectValue placeholder={t("Account")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All accounts")}</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filters.category} onValueChange={(v) => onChange({ ...filters, category: v })}>
          <SelectTrigger className="w-full sm:w-44" aria-label={t("Filter by category")}>
            <SelectValue placeholder={t("Category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All categories")}</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
