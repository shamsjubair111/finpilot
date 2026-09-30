"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Landmark, Plus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AdjustBalanceDialog } from "@/components/accounts/adjust-balance-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { ACCOUNT_GROUPS, ACCOUNT_TYPE_META, netWorthHistory } from "@/lib/accounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/lib/currency";
import type { Account } from "@/types/finance";
import { t as tr } from "@/lib/i18n";

export default function AccountsPage() {
  const { accounts, accountBalances, netWorth, deleteAccount, transactions } = useFinance();
  const [adjusting, setAdjusting] = useState<Account | null>(null);
  const history = useMemo(() => netWorthHistory(accounts, transactions, 12), [accounts, transactions]);
  const change = history.length ? history[history.length - 1].netWorth - history[0].netWorth : 0;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [transferring, setTransferring] = useState(false);

  const linkedCount = deleting ? transactions.filter((t) => t.accountId === deleting.id || t.toAccountId === deleting.id).length : 0;

  const addButton = (
    <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
      <Plus className="size-4" /> {tr("Add Account")}
    </Button>
  );

  return (
    <div>
      <PageHeader
        editOnly
        title={tr("Accounts")}
        subtitle={tr("Bank accounts, bKash, Nagad, cash, credit cards and loans in one place.")}
        actions={
          accounts.length > 0 && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTransferring(true)} disabled={accounts.length < 2}>
                <ArrowLeftRight className="size-4" /> {tr("Transfer")}
              </Button>
              {addButton}
            </>
          )
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={tr("No accounts yet")}
          description={tr("Add your bank account, bKash or Nagad wallet, cash, credit cards and loans. Every transaction can then come from one of them.")}
          action={addButton}
        />
      ) : (
        <div className="space-y-8">
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Total assets", value: netWorth.assets, icon: TrendingUp, tone: "bg-success/10 text-success" },
              { label: "Total liabilities", value: netWorth.liabilities, icon: TrendingDown, tone: "bg-destructive/10 text-destructive" },
              { label: "Net worth", value: netWorth.netWorth, icon: Scale, tone: "bg-primary/10 text-primary" },
            ].map((s) => (
              <div key={s.label} className="glass card-hover rounded-2xl p-5">
                <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${s.tone}`}>
                  <s.icon className="size-[18px]" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{tr(s.label)}</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatCurrency(s.value)}</p>
              </div>
            ))}
          </div>

          {history.some((p) => p.netWorth !== 0) && (
            <Card className="animate-in-up">
              <CardHeader>
                <CardTitle className="text-base">{tr("Net worth over time")}</CardTitle>
                <CardDescription>
                  {change === 0
                    ? tr("No change over the last 12 months.")
                    : tr(change > 0 ? "Up {amount} over the last 12 months." : "Down {amount} over the last 12 months.", { amount: formatCurrency(Math.abs(change)) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetricLineChart
                  data={history.map((p) => ({ month: formatDate(p.monthEnd.toISOString(), "MMM"), netWorth: Math.round(p.netWorth) }))}
                  dataKey="netWorth"
                  name={tr("Net worth")}
                  color="var(--primary)"
                  valueFormatter={(v) => formatCurrency(v, { compact: true })}
                />
              </CardContent>
            </Card>
          )}

          {ACCOUNT_GROUPS.map((group) => {
            const list = accounts.filter((a) => ACCOUNT_TYPE_META[a.type].group === group);
            if (!list.length) return null;
            const total = list.reduce((s, a) => s + (accountBalances.get(a.id) ?? 0), 0);
            return (
              <section key={group} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{tr(group)}</h2>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</span>
                </div>
                <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((a) => (
                    <AccountCard key={a.id} account={a} balance={accountBalances.get(a.id) ?? 0} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} onAdjust={() => setAdjusting(a)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <AccountFormDialog open={creating} onOpenChange={setCreating} />
      <AccountFormDialog account={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <TransactionFormDialog defaultType="transfer" open={transferring} onOpenChange={setTransferring} />
      <AdjustBalanceDialog account={adjusting} onClose={() => setAdjusting(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tr("Delete {name}?", { name: deleting?.name ?? "" })}
        description={
          linkedCount
            ? tr("{count} transactions will be kept but no longer linked to this account.", { count: linkedCount })
            : tr("This account will be permanently removed.")
        }
        onConfirm={() => deleteAccount(deleting!.id)}
      />
    </div>
  );
}
