"use client";

import { useMemo } from "react";
import { TrendingUp, PiggyBank, Wallet, Target, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InsightSection } from "@/components/insights/insight-section";
import { mockInsights } from "@/data/mock-insights";

export default function InsightsPage() {
  const grouped = useMemo(
    () => ({
      spending: mockInsights.filter((i) => i.category === "spending"),
      savings: mockInsights.filter((i) => i.category === "savings"),
      budget: mockInsights.filter((i) => i.category === "budget"),
      goals: mockInsights.filter((i) => i.category === "goals"),
      purchases: mockInsights.filter((i) => i.category === "purchases"),
    }),
    []
  );

  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Automatically generated observations about your finances this month."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InsightSection
          title="Spending Insights"
          icon={TrendingUp}
          insights={grouped.spending}
          emptyLabel="No notable spending changes this month."
        />
        <InsightSection
          title="Savings Insights"
          icon={PiggyBank}
          insights={grouped.savings}
          emptyLabel="No savings insights available yet."
        />
        <InsightSection
          title="Budget Warnings"
          icon={Wallet}
          insights={grouped.budget}
          emptyLabel="All budgets are within healthy limits."
        />
        <InsightSection
          title="Goal Recommendations"
          icon={Target}
          insights={grouped.goals}
          emptyLabel="No goal recommendations right now."
        />
        <InsightSection
          title="Purchase Recommendations"
          icon={ShoppingBag}
          insights={grouped.purchases}
          emptyLabel="No purchase recommendations right now."
        />
      </div>
    </div>
  );
}
