"use client";

import { useMemo, useState } from "react";
import { Plus, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PurchaseCard } from "@/components/wishlist/purchase-card";
import { PurchaseAnalysisDialog } from "@/components/wishlist/purchase-analysis-dialog";
import { PurchaseFormDialog } from "@/components/wishlist/purchase-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { deriveAffordabilityBase } from "@/lib/affordability-context";
import type { PurchaseGoal } from "@/types/finance";

export default function WishlistPage() {
  const { purchases, user, budgetCategories, goals } = useFinance();
  const [selected, setSelected] = useState<PurchaseGoal | null>(null);

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
        actions={
          <PurchaseFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Item
              </Button>
            }
          />
        }
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Your wishlist is empty"
          description="Add something you want to buy and we'll help you figure out when you can safely afford it."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedPurchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              affordabilityBase={affordabilityBase}
              onClick={() => setSelected(purchase)}
            />
          ))}
        </div>
      )}

      <PurchaseAnalysisDialog
        purchase={selected}
        affordabilityBase={affordabilityBase}
        goalMonthlyTotal={affordabilityBase.goalMonthlyTotal}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
