"use client";

import * as React from "react";
import type {
  BudgetCategory,
  FinancialGoal,
  PurchaseGoal,
  Transaction,
  UserProfile,
} from "@/types/finance";
import { mockTransactions } from "@/data/mock-transactions";
import { mockBudgetCategories } from "@/data/mock-budget";
import { mockGoals } from "@/data/mock-goals";
import { mockPurchases } from "@/data/mock-purchases";
import { mockUser } from "@/data/mock-user";

/**
 * FinanceProvider centralizes all mock application state behind a single
 * context so components read/write through hooks instead of importing
 * mock-data files directly for anything mutable. When a backend exists,
 * only the bodies of these functions need to change (to call an API and
 * refetch/update), not the consuming components.
 */
interface FinanceContextValue {
  user: UserProfile;
  updateUser: (patch: Partial<UserProfile>) => void;

  transactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, "id">) => void;

  budgetCategories: BudgetCategory[];
  updateBudgetCategory: (id: string, patch: Partial<BudgetCategory>) => void;

  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<FinancialGoal>) => void;

  purchases: PurchaseGoal[];
  addPurchase: (purchase: Omit<PurchaseGoal, "id" | "createdAt">) => void;
  updatePurchase: (id: string, patch: Partial<PurchaseGoal>) => void;

  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null);

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile>(mockUser);
  const [transactions, setTransactions] = React.useState<Transaction[]>(mockTransactions);
  const [budgetCategories, setBudgetCategories] =
    React.useState<BudgetCategory[]>(mockBudgetCategories);
  const [goals, setGoals] = React.useState<FinancialGoal[]>(mockGoals);
  const [purchases, setPurchases] = React.useState<PurchaseGoal[]>(mockPurchases);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("September 2026");

  const updateUser = React.useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const addTransaction = React.useCallback((txn: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...txn, id: generateId("txn") }, ...prev]);
  }, []);

  const updateBudgetCategory = React.useCallback(
    (id: string, patch: Partial<BudgetCategory>) => {
      setBudgetCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const addGoal = React.useCallback((goal: Omit<FinancialGoal, "id" | "createdAt">) => {
    setGoals((prev) => [
      ...prev,
      { ...goal, id: generateId("goal"), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateGoal = React.useCallback((id: string, patch: Partial<FinancialGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const addPurchase = React.useCallback(
    (purchase: Omit<PurchaseGoal, "id" | "createdAt">) => {
      setPurchases((prev) => [
        ...prev,
        { ...purchase, id: generateId("purchase"), createdAt: new Date().toISOString() },
      ]);
    },
    []
  );

  const updatePurchase = React.useCallback((id: string, patch: Partial<PurchaseGoal>) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const value = React.useMemo<FinanceContextValue>(
    () => ({
      user,
      updateUser,
      transactions,
      addTransaction,
      budgetCategories,
      updateBudgetCategory,
      goals,
      addGoal,
      updateGoal,
      purchases,
      addPurchase,
      updatePurchase,
      selectedMonth,
      setSelectedMonth,
    }),
    [
      user,
      updateUser,
      transactions,
      addTransaction,
      budgetCategories,
      updateBudgetCategory,
      goals,
      addGoal,
      updateGoal,
      purchases,
      addPurchase,
      updatePurchase,
      selectedMonth,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
