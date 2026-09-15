import type {
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
  PurchaseCategory,
  GoalPriority,
} from "@/types/finance";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Housing",
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Subscriptions",
  "Health",
  "Education",
  "Other",
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salary",
  "Freelance",
  "Bonus",
  "Investment",
  "Other",
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "other", label: "Other" },
];

export const PURCHASE_CATEGORIES: PurchaseCategory[] = [
  "Electronics",
  "Vehicle",
  "Home",
  "Travel",
  "Other",
];

export const GOAL_PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const MONTH_OPTIONS = [
  "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026",
];

export const CATEGORY_ICON_MAP: Record<string, string> = {
  Housing: "Home",
  Food: "UtensilsCrossed",
  Transport: "Car",
  Shopping: "ShoppingBag",
  Entertainment: "Clapperboard",
  Bills: "Wifi",
  Subscriptions: "Repeat",
  Health: "HeartPulse",
  Education: "GraduationCap",
  Other: "MoreHorizontal",
  Salary: "Banknote",
  Freelance: "Briefcase",
  Bonus: "Gift",
  Investment: "TrendingUp",
};
