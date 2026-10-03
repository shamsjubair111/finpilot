export type PlanId = "free" | "pro";
export type LimitedResource = "accounts" | "goals" | "budgets" | "purchases";

export const TRIAL_DAYS = 14;

/** AI assistant messages per household per month on Pro; keeps API costs predictable. */
export const ASSISTANT_MONTHLY_LIMIT = 300;

export const PLANS: Record<PlanId, { name: string; priceMonthly: number; priceYearly: number; limits: Record<LimitedResource, number> }> = {
  free: {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    limits: { accounts: 3, goals: 3, budgets: 8, purchases: 5 },
  },
  pro: {
    name: "Pro",
    priceMonthly: 199,
    priceYearly: 1990,
    limits: { accounts: Infinity, goals: Infinity, budgets: Infinity, purchases: Infinity },
  },
};

export const RESOURCE_LABELS: Record<LimitedResource, string> = {
  accounts: "accounts",
  goals: "goals",
  budgets: "budget categories",
  purchases: "wishlist items",
};

/** The plan a user actually gets today: a paid or trial plan falls back to Free once it expires. */
export function effectivePlan(plan: string, expiresAt: Date | string | null | undefined, now = new Date()): PlanId {
  if (plan !== "pro") return "free";
  if (!expiresAt) return "pro";
  return new Date(expiresAt) > now ? "pro" : "free";
}

export function trialEndDate(from = new Date()) {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}
