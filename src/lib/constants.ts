import type {
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
  PurchaseCategory,
  GoalPriority,
  ScenarioInput,
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

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  overrides: Partial<ScenarioInput>;
}

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: "preset-raise",
    name: "Salary Raise",
    description: "Simulate a ৳15,000/month raise with no lifestyle inflation.",
    overrides: { salaryIncrease: 15000 },
  },
  {
    id: "preset-pc",
    name: "Big Purchase",
    description: "Purchase a ৳120,000 purchase in month 4.",
    overrides: { purchaseAmount: 120000, purchaseMonth: 4 },
  },
  {
    id: "preset-lifestyle",
    name: "Lifestyle Inflation",
    description: "Add ৳5,000/month of new discretionary spending.",
    overrides: { additionalMonthlyExpense: 5000 },
  },
  {
    id: "preset-bonus",
    name: "Year-End Bonus",
    description: "One-time ৳50,000 bonus in month 1.",
    overrides: { bonus: 50000 },
  },
];
