"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitButton } from "@/components/shared/submit-button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { buildCategoryModel, suggestCategory } from "@/lib/categorize";
import { ReceiptField } from "./receipt-field";
import { useFinance } from "@/components/providers/finance-provider";
import { PAYMENT_METHODS } from "@/lib/constants";
import { ACCOUNT_TYPE_META } from "@/lib/accounts";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import type { Account, PaymentMethod, Transaction, TransactionType } from "@/types/finance";
import { t as tr } from "@/lib/i18n";

const NO_ACCOUNT = "none";

function paymentMethodFor(account?: Account): PaymentMethod {
  if (!account) return "cash";
  if (account.type === "cash") return "cash";
  if (account.type === "credit_card") return "card";
  if (ACCOUNT_TYPE_META[account.type].group === "Wallets") return "mobile_banking";
  return "bank_transfer";
}

function AccountSelect({
  id,
  value,
  onChange,
  accounts,
  balances,
  allowNone,
  exclude,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  accounts: Account[];
  balances: Map<string, number>;
  allowNone?: boolean;
  exclude?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={tr("Choose account")} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NO_ACCOUNT}>{tr("No account")}</SelectItem>}
        {accounts
          .filter((a) => a.id !== exclude && !a.archived)
          .map((a) => (
            <SelectItem key={a.id} value={a.id}>
              <DynamicIcon name={ACCOUNT_TYPE_META[a.type].icon} className="size-4" style={{ color: ACCOUNT_TYPE_META[a.type].color }} />
              <span className="truncate">{a.name}</span>
              <span className="ml-auto pl-2 text-xs tabular-nums text-muted-foreground">{formatCurrency(balances.get(a.id) ?? 0, { compact: true })}</span>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

interface TransactionFormDialogProps {
  transaction?: Transaction | null;
  defaultType?: TransactionType;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionFormDialog({
  transaction,
  defaultType = "expense",
  trigger,
  open: controlledOpen,
  onOpenChange,
}: TransactionFormDialogProps) {
  const { addTransaction, updateTransaction, accounts, accountBalances, transactions, categoriesFor } = useFinance();
  const categoryModel = React.useMemo(() => buildCategoryModel(transactions), [transactions]);
  // Suggestions only fill the category until the user picks one themselves.
  const [categoryPicked, setCategoryPicked] = React.useState(false);
  const [suggested, setSuggested] = React.useState(false);
  const isEdit = !!transaction;
  const [pending, setPending] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [type, setType] = React.useState<TransactionType>(defaultType);
  const [title, setTitle] = React.useState("");
  const [merchant, setMerchant] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = React.useState(NO_ACCOUNT);
  const [toAccountId, setToAccountId] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<string>("card");
  const [notes, setNotes] = React.useState("");

  const activeAccounts = accounts.filter((a) => !a.archived);
  const hasAccounts = activeAccounts.length > 0;

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    const t = transaction;
    setType(t?.type ?? defaultType);
    setTitle(t?.title ?? "");
    setMerchant(t?.merchant ?? "");
    setCategory(t?.category ?? "");
    setCategoryPicked(!!t);
    setSuggested(false);
    setAmount(t ? String(t.amount) : "");
    setDate((t?.date ?? new Date().toISOString()).slice(0, 10));
    const firstId = activeAccounts[0]?.id;
    setAccountId(t ? t.accountId ?? NO_ACCOUNT : firstId ?? NO_ACCOUNT);
    setToAccountId(t?.toAccountId ?? activeAccounts.find((a) => a.id !== firstId)?.id ?? "");
    setPaymentMethod(t?.paymentMethod ?? paymentMethodFor(activeAccounts[0]));
    setNotes(t?.notes ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function changeText(nextTitle: string, nextMerchant: string) {
    setTitle(nextTitle);
    setMerchant(nextMerchant);
    if (categoryPicked || type === "transfer") return;
    const hit = suggestCategory(categoryModel, nextTitle, nextMerchant, type);
    setCategory(hit ?? "");
    setSuggested(!!hit);
  }

  const isTransfer = type === "transfer";
  const categories = categoriesFor(type === "income" ? "income" : "expense");
  const fromAccount = accounts.find((a) => a.id === accountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const isValid =
    Number(amount) > 0 &&
    (isTransfer ? accountId !== NO_ACCOUNT && !!toAccountId && accountId !== toAccountId : title.trim() && category);

  function changeAccount(id: string) {
    setAccountId(id);
    if (id !== NO_ACCOUNT) setPaymentMethod(paymentMethodFor(accounts.find((a) => a.id === id)));
    if (id === toAccountId) setToAccountId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      type,
      title: isTransfer ? title.trim() || `${fromAccount?.name} → ${toAccount?.name}` : title.trim(),
      merchant: isTransfer ? "" : merchant.trim(),
      category: (isTransfer ? "Transfer" : category) as Transaction["category"],
      date,
      amount: Number(amount),
      paymentMethod: (isTransfer ? "bank_transfer" : paymentMethod) as PaymentMethod,
      notes: notes.trim() || undefined,
      accountId: accountId === NO_ACCOUNT ? null : accountId,
      toAccountId: isTransfer ? toAccountId : null,
    };
    const ok = isEdit ? await updateTransaction(transaction!.id, data) : await addTransaction(data);
    setPending(false);
    if (ok) setOpen(false);
  }

  const label = tr(isTransfer ? "Transfer" : type === "income" ? "Income" : "Expense");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? tr("Edit {type}", { type: label }) : tr("Add {type}", { type: label })}</DialogTitle>
          <DialogDescription>
            {isTransfer
              ? tr("Move money between your accounts — e.g. bank → bKash, or pay off a credit card or loan.")
              : tr("Record money coming in or going out, and which account it used.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as TransactionType);
              setCategory("");
              setCategoryPicked(false);
              setSuggested(false);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">{tr("Expense")}</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">{tr("Income")}</TabsTrigger>
              <TabsTrigger value="transfer" className="flex-1" disabled={activeAccounts.length < 2}>{tr("Transfer")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {!hasAccounts && (
            <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              {tr("Tip:")}{" "}
              <Link href="/accounts" className="font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
                {tr("add your bank, bKash or card")}
              </Link>{" "}
              {tr("to track balances per account.")}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isTransfer ? (
              <div className="space-y-2 rounded-2xl border border-border p-3 sm:col-span-2">
                <div className="space-y-1.5">
                  <Label htmlFor="txn-from">{tr("From")}</Label>
                  <AccountSelect id="txn-from" value={accountId === NO_ACCOUNT ? "" : accountId} onChange={changeAccount} accounts={accounts} balances={accountBalances} />
                </div>
                <div className="flex justify-center">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ArrowDown className="size-4" />
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="txn-to">{tr("To")}</Label>
                  <AccountSelect id="txn-to" value={toAccountId} onChange={setToAccountId} accounts={accounts} balances={accountBalances} exclude={accountId} />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="txn-title">{tr("Title")}</Label>
                <Input
                  id="txn-title"
                  placeholder={type === "income" ? tr("e.g. Salary") : tr("e.g. Groceries")}
                  value={title}
                  onChange={(e) => changeText(e.target.value, merchant)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="txn-amount">{`${tr("Amount")} (${getCurrencySymbol()})`}</Label>
              <Input id="txn-amount" type="number" min={0} step="any" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-date">{tr("Date")}</Label>
              <Input id="txn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {!isTransfer && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="txn-category" className="flex items-center gap-1.5">
                    {tr("Category")}
                    {suggested && !categoryPicked && <span className="text-[10px] font-normal text-primary">{tr("Suggested")}</span>}
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v);
                      setCategoryPicked(true);
                    }}
                  >
                    <SelectTrigger id="txn-category" className="w-full">
                      <SelectValue placeholder={tr("Select category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{tr(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="txn-account">{type === "income" ? tr("Received in") : tr("Paid from")}</Label>
                  <AccountSelect id="txn-account" value={accountId} onChange={changeAccount} accounts={accounts} balances={accountBalances} allowNone />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="txn-merchant">{type === "income" ? tr("From (optional)") : tr("Merchant (optional)")}</Label>
                  <Input id="txn-merchant" placeholder={type === "income" ? tr("e.g. Employer") : tr("e.g. Shwapno")} value={merchant} onChange={(e) => changeText(title, e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="txn-payment">{tr("Payment method")}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="txn-payment" className="w-full">
                      <SelectValue placeholder={tr("Select method")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{tr(m.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {isTransfer && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="txn-title">{tr("Description (optional)")}</Label>
                <Input id="txn-title" placeholder={tr("e.g. Credit card bill payment")} value={title} onChange={(e) => changeText(e.target.value, merchant)} />
              </div>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="txn-notes">{tr("Notes (optional)")}</Label>
              <Textarea id="txn-notes" placeholder={tr("Add any extra detail...")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {isEdit && transaction && (
              <div className="sm:col-span-2">
                <ReceiptField transactionId={transaction.id} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tr("Cancel")}
            </Button>
            <SubmitButton pending={pending} disabled={!isValid}>
              {isEdit ? tr("Save changes") : tr("Add {type}", { type: label })}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
