"use client";

import * as React from "react";
import { Plus, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { categoryColor } from "@/lib/chart-colors";
import { t } from "@/lib/i18n";

export function CategoriesCard() {
  const { customCategories, addCustomCategory, deleteCustomCategory, readOnly } = useFinance();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"expense" | "income">("expense");
  const [pending, setPending] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    if (await addCustomCategory({ name: name.trim(), type })) setName("");
    setPending(false);
  }

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="size-4 text-muted-foreground" /> {t("Your categories")}
        </CardTitle>
        <CardDescription>{t("Add categories of your own, like Kids, Charity or Pets. They appear everywhere you pick a category.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={t("Category name")} aria-label={t("Category name")} className="sm:flex-1" />
            <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
              <SelectTrigger className="sm:w-36" aria-label={t("Type")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t("Expense")}</SelectItem>
                <SelectItem value="income">{t("Income")}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!name.trim() || pending} className="gap-1.5">
              <Plus className="size-4" />
              {t("Add")}
            </Button>
          </form>
        )}
        {customCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No custom categories yet.")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customCategories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(c.name) }} />
                {c.name}
                <span className="text-xs text-muted-foreground">{c.type === "income" ? t("Income") : t("Expense")}</span>
                {!readOnly && (
                  <button type="button" onClick={() => deleteCustomCategory(c.id)} className="text-muted-foreground hover:text-destructive" aria-label={t("Remove {name}", { name: c.name })}>
                    <X className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
