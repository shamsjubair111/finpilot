"use client";

import * as React from "react";
import { LineChart, Plus } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvestmentFormDialog, KIND_LABELS } from "@/components/investments/investment-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { valueInvestment } from "@/lib/calculations/investments";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";
import type { Investment } from "@/types/finance";

export default function InvestmentsPage() {
  const { investments, deleteInvestment } = useFinance();
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Investment | null>(null);
  const [deleting, setDeleting] = React.useState<Investment | null>(null);

  const rows = React.useMemo(() => {
    const now = new Date();
    return investments
      .map((i) => ({ i, v: valueInvestment(i, now) }))
      .sort((a, b) => (a.v.daysToMaturity ?? Infinity) - (b.v.daysToMaturity ?? Infinity));
  }, [investments]);

  const invested = rows.reduce((s, r) => s + r.v.invested, 0);
  const value = rows.reduce((s, r) => s + r.v.value, 0);
  const profit = rows.reduce((s, r) => s + r.v.profit, 0);
  const maturingSoon = rows.filter((r) => r.v.daysToMaturity !== null && !r.v.matured && r.v.daysToMaturity <= 90);

  return (
    <div>
      <PageHeader
        editOnly
        title={t("Investments")}
        subtitle={t("Sanchayapatra, FDR, DPS, shares and gold — with profit and maturity at a glance.")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            {t("Add investment")}
          </Button>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={LineChart}
              title={t("No investments yet")}
              description={t("Track savings certificates, fixed deposits and shares to see your profit and upcoming maturities.")}
              action={<Button size="sm" onClick={() => setAdding(true)}>{t("Add investment")}</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="stagger mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("Invested"), value: formatCurrency(invested) },
              { label: t("Current value"), value: formatCurrency(value) },
              { label: t("Profit to date"), value: formatCurrency(profit), tone: profit >= 0 ? "text-success" : "text-destructive" },
              { label: t("Maturing in 90 days"), value: String(maturingSoon.length) },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("mt-1 text-lg font-semibold tabular-nums", s.tone)}>{s.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="divide-y pt-2">
              {rows.map(({ i, v }) => (
                <div key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {i.name}
                      <Badge variant="secondary" className="text-[10px]">{t(KIND_LABELS[i.kind])}</Badge>
                      {v.matured && <Badge className="text-[10px]">{t("Matured")}</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        i.institution,
                        i.rate ? t("{rate}% a year", { rate: i.rate }) : null,
                        i.maturityDate
                          ? v.matured
                            ? t("matured {date}", { date: formatDate(i.maturityDate, "d MMM yyyy") })
                            : t("matures {date} ({n} days)", { date: formatDate(i.maturityDate, "d MMM yyyy"), n: v.daysToMaturity ?? 0 })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatCurrency(v.value)}</p>
                    <p className={cn("text-xs tabular-nums", v.profit >= 0 ? "text-success" : "text-destructive")}>
                      {v.profit >= 0 ? "+" : ""}
                      {formatCurrency(v.profit)}
                      {v.maturityValue !== null && v.method !== "market" && !v.matured && (
                        <span className="text-muted-foreground"> · {t("at maturity {amount}", { amount: formatCurrency(v.maturityValue) })}</span>
                      )}
                    </p>
                  </div>
                  <RowActions label={i.name} onEdit={() => setEditing(i)} onDelete={() => setDeleting(i)} />
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Estimates before tax and fees. Fixed-income profit uses simple interest; periodic payouts count completed periods only.")}
          </p>
        </>
      )}

      <InvestmentFormDialog open={adding} onOpenChange={setAdding} />
      <InvestmentFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} investment={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete investment?")}
        description={t("\"{name}\" will be removed permanently.", { name: deleting?.name ?? "" })}
        onConfirm={() => deleteInvestment(deleting!.id)}
      />
    </div>
  );
}
