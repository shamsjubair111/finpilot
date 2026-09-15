import type { ScenarioInput } from "@/types/finance";
import { mockUser } from "./mock-user";
import { mockBudgetCategories } from "./mock-budget";

const essentials = mockBudgetCategories
  .filter((c) => ["Housing", "Bills", "Food"].includes(c.category))
  .reduce((sum, c) => sum + c.budgeted, 0);

const lifestyle = mockBudgetCategories
  .filter((c) => !["Housing", "Bills", "Food"].includes(c.category))
  .reduce((sum, c) => sum + c.budgeted, 0);

// Default Scenario Lab inputs, derived from the mock user's real budget so
// the "Current Plan" baseline matches the rest of the app.
export const defaultScenarioInput: ScenarioInput = {
  monthlySalary: mockUser.monthlySalary,
  essentialExpenses: essentials,
  lifestyleSpending: lifestyle,
  savingsTarget: mockUser.defaultSavingsTarget,
  currentSavings: mockUser.currentSavings,
  emergencyFund: mockUser.emergencyFundCurrent,
  purchaseAmount: 0,
  purchaseMonth: 3,
  salaryIncrease: 0,
  additionalMonthlyExpense: 0,
  bonus: 0,
  periodMonths: 12,
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
    name: "Buy Gaming PC",
    description: "Purchase the ৳120,000 gaming PC in month 4.",
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
