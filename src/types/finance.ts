// Core domain types for Sanchay, shared by the API responses and the UI.

export type Currency = "BDT" | "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "AED" | "SAR" | "MYR" | "SGD" | "JPY";

export type TransactionType = "income" | "expense" | "transfer";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "mobile_banking"
  | "other";

export type ExpenseCategory =
  | "Housing"
  | "Food"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Subscriptions"
  | "Health"
  | "Education"
  | "Other";

export type IncomeCategory = "Salary" | "Freelance" | "Bonus" | "Investment" | "Other";

export interface Transaction {
  id: string;
  title: string;
  merchant: string;
  category: ExpenseCategory | IncomeCategory;
  date: string; // ISO date string
  amount: number; // always positive; sign derived from `type`
  type: TransactionType;
  paymentMethod: PaymentMethod;
  notes?: string;
  accountId?: string | null;
  toAccountId?: string | null;
}

export type AccountType =
  | "bank"
  | "bkash"
  | "nagad"
  | "rocket"
  | "upay"
  | "cash"
  | "credit_card"
  | "loan"
  | "savings"
  | "e_wallet"
  | "investment"
  | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: string | null;
  accountNumber?: string | null;
  openingBalance: number;
  creditLimit?: number | null;
  interestRate?: number | null;
  color: string;
  archived?: boolean;
  createdAt?: string;
}

export interface BudgetCategory {
  id: string;
  category: ExpenseCategory;
  budgeted: number;
  spent: number;
  icon: string; // lucide icon key
  color: string; // hex or css color token
}

export type BudgetStatus = "on_track" | "near_limit" | "over_budget";

export type GoalPriority = "high" | "medium" | "low";

export interface FinancialGoal {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  goalAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date
  monthlyContribution: number;
  priority: GoalPriority;
  category: "emergency" | "purchase" | "education" | "travel" | "other";
  createdAt: string;
}

export type PurchaseCategory =
  | "Electronics"
  | "Vehicle"
  | "Home"
  | "Travel"
  | "Other";

export interface PurchaseGoal {
  id: string;
  name: string;
  price: number;
  priority: GoalPriority;
  savedAmount: number;
  desiredDate: string; // ISO date
  category: PurchaseCategory;
  notes?: string;
  createdAt: string;
}

export type AffordabilityStatus =
  | "safe"
  | "reasonable"
  | "wait"
  | "high_risk";

export interface AffordabilityResult {
  score: number; // 0-100
  status: AffordabilityStatus;
  label: string; // e.g. "Safe to Buy"
  reasons: string[];
}

export interface PurchaseStrategy {
  name: "Comfortable" | "Balanced" | "Aggressive";
  monthlyContribution: number;
  estimatedMonths: number;
  description: string;
}

export interface MonthlyFinancials {
  month: string; // e.g. "Apr 2026"
  income: number;
  expenses: number;
  savings: number;
}

export interface FinancialSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number; // percentage
  availableToSpend: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
}

export interface ScenarioInput {
  monthlySalary: number;
  essentialExpenses: number;
  lifestyleSpending: number;
  savingsTarget: number;
  currentSavings: number;
  emergencyFund: number;
  purchaseAmount: number;
  purchaseMonth: number; // 1-indexed month within scenario period
  salaryIncrease: number;
  additionalMonthlyExpense: number;
  bonus: number;
  periodMonths: 3 | 6 | 12 | 24;
}

export interface ScenarioMonthProjection {
  month: number;
  label: string;
  income: number;
  expenses: number;
  savingsBalance: number;
  emergencyFund: number;
  netCashFlow: number;
}

export interface ScenarioResult {
  projections: ScenarioMonthProjection[];
  totalProjectedSavings: number;
  totalProjectedSpending: number;
  finalEmergencyFund: number;
  savingsRate: number;
  lowestProjectedBalance: number;
  cashFlowStatus: "positive" | "tight" | "negative";
  riskLevel: "low" | "medium" | "high";
  insights: string[];
}

export interface FinancialHealthFactor {
  label: string;
  score: number; // 0-100 contribution
  weight: number;
  detail: string;
}

export interface FinancialHealth {
  score: number; // 0-100
  status: "Excellent" | "Healthy" | "Fair" | "At Risk";
  factors: FinancialHealthFactor[];
  insights: string[];
}

export interface TimelineMilestone {
  id: string;
  date: string; // ISO date
  title: string;
  description: string;
  type: "purchase" | "goal" | "emergency_fund" | "contribution";
  icon: string;
  amount?: number;
}

export interface Insight {
  id: string;
  category: "spending" | "savings" | "budget" | "goals" | "purchases";
  severity: "positive" | "neutral" | "warning";
  title: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: Currency;
  monthlySalary: number;
  currentSavings: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
  defaultSavingsTarget: number;
  memberSince: string;
  language: "en" | "bn";
}

export interface UpcomingCommitment {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  amount: number;
  icon: string;
  recurring: boolean;
}
