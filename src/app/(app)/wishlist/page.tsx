"use client";

import { useMemo, useState } from "react";
import { Plus, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PurchaseCard } from "@/components/wishlist/purchase-card";
import { PurchaseAnalysisDialog } from "@/components/wishlist/purchase-analysis-dialog";
import { PurchaseFormDialog } from "@/components/wishlist/purchase-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { deriveAffordabilityBase } from "@/lib/affordability-context";
import type { PurchaseGoal } from "@/types/finance";

export default function WishlistPage() {
  const { purchases, user, budgetCategories, goals, deletePurchase } = useFinance();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PurchaseGoal | null>(null);
  const [deleting, setDeleting] = useState<PurchaseGoal | null>(null);
  const selected = purchases.find((p) => p.id === selectedId) ?? null;
  const addButton = (
    <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
      <Plus className="size-4" />
      Add Item
    </Button>
  );

  const affordabilityBase = useMemo(
    () => deriveAffordabilityBase(user, budgetCategories, goals),
    [user, budgetCategories, goals]
  );

  const sortedPurchases = useMemo(
    () => [...purchases].sort((a, b) => new Date(a.desiredDate).getTime() - new Date(b.desiredDate).getTime()),
    [purchases]
  );

  return (
    <div>
      <PageHeader
        title="Wishlist"
        subtitle="Plan future purchases and see how affordable they really are."
        actions={purchases.length > 0 && addButton}
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Your wishlist is empty"
          description="Add something you want to buy and we'll help you figure out when you can safely afford it."
          action={addButton}
        />
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedPurchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              affordabilityBase={affordabilityBase}
              onClick={() => setSelectedId(purchase.id)}
            />
          ))}
        </div>
      )}

      <PurchaseAnalysisDialog
        purchase={selected}
        affordabilityBase={affordabilityBase}
        goalMonthlyTotal={affordabilityBase.goalMonthlyTotal}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onEdit={() => {
          setEditing(selected);
          setSelectedId(null);
        }}
        onDelete={() => {
          setDeleting(selected);
          setSelectedId(null);
        }}
      />
      <PurchaseFormDialog open={creating} onOpenChange={setCreating} />
      <PurchaseFormDialog purchase={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove from wishlist?"
        description={`"${deleting?.name}" will be permanently removed.`}
        onConfirm={() => deletePurchase(deleting!.id)}
      />
    </div>
  );
}
