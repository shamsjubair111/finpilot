import type { PlanId } from "./plans";

// Shown on the billing and pricing pages; each line is also a translation key.
export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    "Up to 3 accounts and 3 goals",
    "Up to 8 budget categories",
    "Transactions and SMS import",
    "Dashboard, insights and reports",
    "English and বাংলা",
  ],
  pro: [
    "Unlimited accounts, goals and budgets",
    "Unlimited wishlist with affordability checks",
    "Scenario Lab and timeline planning",
    "Data export at any time",
    "Priority support",
  ],
};
