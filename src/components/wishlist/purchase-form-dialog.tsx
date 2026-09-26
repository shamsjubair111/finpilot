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
import { useFinance } from "@/components/providers/finance-provider";
import { SubmitButton } from "@/components/shared/submit-button";
import { GOAL_PRIORITIES, PURCHASE_CATEGORIES } from "@/lib/constants";
import type { GoalPriority, PurchaseCategory, PurchaseGoal } from "@/types/finance";

export function PurchaseFormDialog({
  purchase,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  purchase?: PurchaseGoal | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addPurchase, updatePurchase } = useFinance();
  const isEdit = !!purchase;
  const [pending, setPending] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [savedAmount, setSavedAmount] = React.useState("");
  const [desiredDate, setDesiredDate] = React.useState("");
  const [priority, setPriority] = React.useState<GoalPriority>("medium");
  const [category, setCategory] = React.useState<PurchaseCategory>("Electronics");
  const [notes, setNotes] = React.useState("");

  const isValid = name.trim() && price && Number(price) > 0 && desiredDate;

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setName(purchase?.name ?? "");
    setPrice(purchase ? String(purchase.price) : "");
    setSavedAmount(purchase ? String(purchase.savedAmount) : "");
    setDesiredDate(purchase ? purchase.desiredDate.slice(0, 10) : "");
    setPriority(purchase?.priority ?? "medium");
    setCategory(purchase?.category ?? "Electronics");
    setNotes(purchase?.notes ?? "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      name: name.trim(),
      price: Number(price),
      priority,
      savedAmount: Number(savedAmount) || 0,
      desiredDate,
      category,
      notes: notes.trim() || undefined,
    };
    const ok = isEdit ? await updatePurchase(purchase!.id, data) : await addPurchase(data);
    setPending(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Wishlist Item" : "Add to Wishlist"}</DialogTitle>
          <DialogDescription>Plan a future purchase and track its affordability.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="purchase-name">Item Name</Label>
              <Input id="purchase-name" placeholder="e.g. Mechanical Keyboard" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-price">Price (৳)</Label>
              <Input id="purchase-price" type="number" min={0} step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-saved">Already Saved (৳)</Label>
              <Input id="purchase-saved" type="number" min={0} step="any" inputMode="decimal" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-date">Desired Date</Label>
              <Input id="purchase-date" type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger id="purchase-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="purchase-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PurchaseCategory)}>
                <SelectTrigger id="purchase-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="purchase-notes">Notes (optional)</Label>
              <Textarea id="purchase-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? "Save changes" : "Add Item"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
