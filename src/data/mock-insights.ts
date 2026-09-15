import type { Insight } from "@/types/finance";

// Central mock insights feed. In production these would be generated
// server-side from real transaction/goal data using the same rule-based
// logic in lib/calculations, then served via GET /api/insights.
export const mockInsights: Insight[] = [
  {
    id: "insight-1",
    category: "spending",
    severity: "warning",
    title: "Food spending is up 15% vs last month",
    description: "You spent ৳6,200 on food this month compared to ৳5,400 last month.",
  },
  {
    id: "insight-2",
    category: "savings",
    severity: "positive",
    title: "Savings rate increased to 47%",
    description: "Your savings rate climbed from 41% last month to 47% this month.",
  },
  {
    id: "insight-3",
    category: "spending",
    severity: "warning",
    title: "Shopping is your fastest-growing discretionary expense",
    description: "Shopping spend grew 35% month-over-month, faster than any other category.",
  },
  {
    id: "insight-4",
    category: "goals",
    severity: "neutral",
    title: "Emergency fund on pace for 6 more months",
    description:
      "At your current ৳5,000/month contribution, your emergency fund will reach its ৳180,000 target in about 6 months.",
  },
  {
    id: "insight-5",
    category: "purchases",
    severity: "neutral",
    title: "Consider waiting on the Gaming PC",
    description:
      "Waiting 3 more months before buying the Gaming PC would significantly improve your emergency reserve and affordability score.",
  },
  {
    id: "insight-6",
    category: "budget",
    severity: "warning",
    title: "Shopping budget is close to its limit",
    description: "You've used 93% of your ৳4,500 shopping budget with days left in the month.",
  },
  {
    id: "insight-7",
    category: "savings",
    severity: "positive",
    title: "Freelance income boosted July savings",
    description: "An extra ৳8,500 freelance payment helped you save an additional ৳9,900 in July.",
  },
  {
    id: "insight-8",
    category: "goals",
    severity: "positive",
    title: "Laptop Fund is ahead of schedule",
    description: "At the current contribution rate, you'll reach your Laptop Fund goal a month early.",
  },
  {
    id: "insight-9",
    category: "budget",
    severity: "neutral",
    title: "Entertainment spending is well controlled",
    description: "You're at 83% of your entertainment budget, tracking comfortably within limits.",
  },
  {
    id: "insight-10",
    category: "purchases",
    severity: "positive",
    title: "SSD purchase is low risk",
    description: "The 512GB SSD scores 96/100 for affordability — safe to buy this month.",
  },
];
