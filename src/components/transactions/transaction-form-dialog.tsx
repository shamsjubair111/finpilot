"use client";

import * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import type { Transaction, TransactionType } from "@/types/finance";

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
  const { addTransaction, updateTransaction } = useFinance();
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
  const [paymentMethod, setPaymentMethod] = React.useState("card");
  const [notes, setNotes] = React.useState("");

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setType(transaction?.type ?? defaultType);
    setTitle(transaction?.title ?? "");
    setMerchant(transaction?.merchant ?? "");
    setCategory(transaction?.category ?? "");
    setAmount(transaction ? String(transaction.amount) : "");
    setDate((transaction?.date ?? new Date().toISOString()).slice(0, 10));
    setPaymentMethod(transaction?.paymentMethod ?? "card");
    setNotes(transaction?.notes ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isValid = title.trim() && amount && Number(amount) > 0 && category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      title: title.trim(),
      merchant: merchant.trim(),
      category: category as Transaction["category"],
      date,
      amount: Number(amount),
      type,
      paymentMethod: paymentMethod as Transaction["paymentMethod"],
      notes: notes.trim() || undefined,
    };
    const ok = isEdit ? await updateTransaction(transaction!.id, data) : await addTransaction(data);
    setPending(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details of this transaction." : "Record a new income or expense. It's saved to your account instantly."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => { setType(v as TransactionType); setCategory(""); }}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="txn-title">Title</Label>
              <Input
                id="txn-title"
                placeholder={type === "income" ? "e.g. Salary" : "e.g. Groceries"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-amount">Amount (৳)</Label>
              <Input
                id="txn-amount"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-date">Date</Label>
              <Input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="txn-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txn-merchant">Merchant (optional)</Label>
              <Input
                id="txn-merchant"
                placeholder="e.g. Shwapno"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="txn-payment">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="txn-payment" className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="txn-notes">Notes (optional)</Label>
              <Textarea
                id="txn-notes"
                placeholder="Add any extra detail..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending} disabled={!isValid}>
              {isEdit ? "Save changes" : `Add ${type === "income" ? "Income" : "Expense"}`}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
