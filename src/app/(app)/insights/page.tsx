"use client";

import { useMemo } from "react";
import { TrendingUp, PiggyBank, Wallet, Target, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InsightSection } from "@/components/insights/insight-section";
import { useFinance } from "@/components/providers/finance-provider";
import { generateInsights } from "@/lib/derive";
import { t } from "@/lib/i18n";

export default function InsightsPage() {
  const { user, transactions, budgetCategories, goals, purchases } = useFinance();
  const insights = useMemo(
    () => generateInsights({ user, transactions, budgets: budgetCategories, goals, purchases }),
    [user, transactions, budgetCategories, goals, purchases]
  );
  const grouped = useMemo(
    () => ({
      spending: insights.filter((i) => i.category === "spending"),
      savings: insights.filter((i) => i.category === "savings"),
      budget: insights.filter((i) => i.category === "budget"),
      goals: insights.filter((i) => i.category === "goals"),
      purchases: insights.filter((i) => i.category === "purchases"),
    }),
    [insights]
  );

  return (
    <div>
      <PageHeader
        title={t("Insights")}
        subtitle={t("Observations generated live from your transactions, budgets, goals and wishlist.")}
      />

      <div className="stagger grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InsightSection
          title={t("Spending Insights")}
          icon={TrendingUp}
          insights={grouped.spending}
          emptyLabel={t("No notable spending changes this month.")}
        />
        <InsightSection
          title={t("Savings Insights")}
          icon={PiggyBank}
          insights={grouped.savings}
          emptyLabel={t("No savings insights available yet.")}
        />
        <InsightSection
          title={t("Budget Warnings")}
          icon={Wallet}
          insights={grouped.budget}
          emptyLabel={t("All budgets are within healthy limits.")}
        />
        <InsightSection
          title={t("Goal Recommendations")}
          icon={Target}
          insights={grouped.goals}
          emptyLabel={t("No goal recommendations right now.")}
        />
        <InsightSection
          title={t("Purchase Recommendations")}
          icon={ShoppingBag}
          insights={grouped.purchases}
          emptyLabel={t("No purchase recommendations right now.")}
        />
      </div>
    </div>
  );
}
