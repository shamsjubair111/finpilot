"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { INVESTMENT_KINDS, PAYOUTS, type InvestmentKind, type Payout } from "@/lib/calculations/investments";
import { getCurrencySymbol } from "@/lib/currency";
import { t } from "@/lib/i18n";
import type { Investment } from "@/types/finance";

export const KIND_LABELS: Record<InvestmentKind, string> = {
  sanchayapatra: "Sanchayapatra (savings certificate)",
  fdr: "Fixed deposit (FDR)",
  dps: "DPS (monthly savings scheme)",
  stock: "Shares",
  mutual_fund: "Mutual fund",
  gold: "Gold",
  bond: "Bond",
  other: "Other",
};
const PAYOUT_LABELS: Record<Payout, string> = { maturity: "At maturity", monthly: "Monthly", quarterly: "Every 3 months" };
const MARKET: InvestmentKind[] = ["stock", "mutual_fund", "gold", "other"];

const toDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export function InvestmentFormDialog({ open, onOpenChange, investment }: { open: boolean; onOpenChange: (o: boolean) => void; investment?: Investment | null }) {
  const { addInvestment, updateInvestment } = useFinance();
  const symbol = getCurrencySymbol();
  const [kind, setKind] = React.useState<InvestmentKind>("sanchayapatra");
  const [name, setName] = React.useState("");
  const [institution, setInstitution] = React.useState("");
  const [principal, setPrincipal] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [maturityDate, setMaturityDate] = React.useState("");
  const [payout, setPayout] = React.useState<Payout>("quarterly");
  const [monthlyDeposit, setMonthlyDeposit] = React.useState("");
  const [currentValue, setCurrentValue] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setKind(investment?.kind ?? "sanchayapatra");
    setName(investment?.name ?? "");
    setInstitution(investment?.institution ?? "");
    setPrincipal(investment ? String(investment.principal) : "");
    setRate(investment ? String(investment.rate) : "");
    setStartDate(toDate(investment?.startDate) || new Date().toISOString().slice(0, 10));
    setMaturityDate(toDate(investment?.maturityDate));
    setPayout(investment?.payout ?? "quarterly");
    setMonthlyDeposit(investment?.monthlyDeposit ? String(investment.monthlyDeposit) : "");
    setCurrentValue(investment?.currentValue ? String(investment.currentValue) : "");
    setNotes(investment?.notes ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const market = MARKET.includes(kind);
  const dps = kind === "dps";
  const valid = name.trim() && startDate && (dps ? Number(monthlyDeposit) > 0 : Number(principal) > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    const data = {
      name: name.trim(),
      kind,
      institution: institution.trim() || null,
      principal: dps ? 0 : Number(principal),
      rate: market ? 0 : Number(rate) || 0,
      startDate,
      maturityDate: maturityDate || null,
      payout: dps || market ? ("maturity" as const) : payout,
      monthlyDeposit: dps ? Number(monthlyDeposit) : null,
      currentValue: market && currentValue ? Number(currentValue) : null,
      notes: notes.trim() || null,
    };
    const ok = investment ? await updateInvestment(investment.id, data) : await addInvestment(data);
    setPending(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{investment ? t("Edit investment") : t("Add investment")}</DialogTitle>
          <DialogDescription>{t("Profit figures are pre-tax estimates.")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="inv-kind">{t("Type")}</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as InvestmentKind)}>
                <SelectTrigger id="inv-kind" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVESTMENT_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{t(KIND_LABELS[k])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">{t("Name")}</Label>
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("e.g. 3-year Sanchayapatra")} maxLength={80} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-inst">{t("Bank or broker")}</Label>
              <Input id="inv-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={80} />
            </div>
            {dps ? (
              <div className="space-y-1.5">
                <Label htmlFor="inv-monthly">{t("Monthly deposit")} ({symbol})</Label>
                <Input id="inv-monthly" type="number" min={0} step="any" value={monthlyDeposit} onChange={(e) => setMonthlyDeposit(e.target.value)} required />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="inv-principal">{t("Amount invested")} ({symbol})</Label>
                <Input id="inv-principal" type="number" min={0} step="any" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
              </div>
            )}
            {market ? (
              <div className="space-y-1.5">
                <Label htmlFor="inv-value">{t("Current value")} ({symbol})</Label>
                <Input id="inv-value" type="number" min={0} step="any" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="inv-rate">{t("Profit rate % per year")}</Label>
                <Input id="inv-rate" type="number" min={0} max={100} step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="inv-start">{t("Start date")}</Label>
              <Input id="inv-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-maturity">{t("Maturity date")}</Label>
              <Input id="inv-maturity" type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} min={startDate} />
            </div>
            {!market && !dps && (
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="inv-payout">{t("Profit paid")}</Label>
                <Select value={payout} onValueChange={(v) => setPayout(v as Payout)}>
                  <SelectTrigger id="inv-payout" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYOUTS.map((p) => (
                      <SelectItem key={p} value={p}>{t(PAYOUT_LABELS[p])}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="inv-notes">{t("Notes")}</Label>
              <Textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("Cancel")}</Button>
            <SubmitButton pending={pending} disabled={!valid}>{investment ? t("Save changes") : t("Add investment")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
