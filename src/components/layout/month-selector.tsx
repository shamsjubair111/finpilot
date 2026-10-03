"use client";

import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { monthOptions } from "@/lib/derive";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useFinance();

  return (
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 text-xs font-medium shadow-none sm:text-sm" size="sm" aria-label={t("Month")}>
        <CalendarDays className="size-3.5 text-muted-foreground" />
        <SelectValue>{formatDate(selectedMonth, "MMMM yyyy")}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {monthOptions().map((m) => (
          <SelectItem key={m} value={m}>
            {formatDate(m, "MMMM yyyy")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
