import type { BudgetCategory } from "@/types/finance";

// Central mock monthly budget. `spent` simulates the current month's
// spending to date against each category's `budgeted` allocation.
// Replace with GET /api/budget when the backend exists.
export const mockBudgetCategories: BudgetCategory[] = [
  {
    id: "cat-housing",
    category: "Housing",
    budgeted: 12000,
    spent: 12000,
    icon: "Home",
    color: "var(--chart-1)",
  },
  {
    id: "cat-food",
    category: "Food",
    budgeted: 8000,
    spent: 6200,
    icon: "UtensilsCrossed",
    color: "var(--chart-2)",
  },
  {
    id: "cat-transport",
    category: "Transport",
    budgeted: 5000,
    spent: 3800,
    icon: "Car",
    color: "var(--chart-3)",
  },
  {
    id: "cat-bills",
    category: "Bills",
    budgeted: 2000,
    spent: 2000,
    icon: "Wifi",
    color: "var(--chart-4)",
  },
  {
    id: "cat-entertainment",
    category: "Entertainment",
    budgeted: 3500,
    spent: 2900,
    icon: "Clapperboard",
    color: "var(--chart-5)",
  },
  {
    id: "cat-shopping",
    category: "Shopping",
    budgeted: 4500,
    spent: 4200,
    icon: "ShoppingBag",
    color: "var(--chart-1)",
  },
  {
    id: "cat-subscriptions",
    category: "Subscriptions",
    budgeted: 1500,
    spent: 1500,
    icon: "Repeat",
    color: "var(--chart-2)",
  },
  {
    id: "cat-other",
    category: "Other",
    budgeted: 3000,
    spent: 2400,
    icon: "MoreHorizontal",
    color: "var(--chart-3)",
  },
];

export const mockMonthlyIncome = 66000;
