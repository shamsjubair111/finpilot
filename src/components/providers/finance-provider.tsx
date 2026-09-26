"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  BudgetCategory,
  FinancialGoal,
  PurchaseGoal,
  Transaction,
  UpcomingCommitment,
  UserProfile,
} from "@/types/finance";
import { api, ApiClientError } from "@/lib/api-client";
import { FullPageLoader } from "@/components/shared/full-page-loader";

type StoredBudget = Omit<BudgetCategory, "spent">;
type NewOf<T> = Omit<T, "id" | "createdAt">;

interface FinanceContextValue {
  user: UserProfile;
  updateUser: (patch: Partial<UserProfile>, successMessage?: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
  signOut: () => Promise<void>;

  transactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, "id">) => Promise<boolean>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;

  budgetCategories: BudgetCategory[];
  addBudgetCategory: (budget: Omit<StoredBudget, "id">) => Promise<boolean>;
  updateBudgetCategory: (id: string, patch: Partial<StoredBudget>) => Promise<boolean>;
  deleteBudgetCategory: (id: string) => Promise<boolean>;

  goals: FinancialGoal[];
  addGoal: (goal: NewOf<FinancialGoal>) => Promise<boolean>;
  updateGoal: (id: string, patch: Partial<FinancialGoal>, successMessage?: string) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;

  purchases: PurchaseGoal[];
  addPurchase: (purchase: NewOf<PurchaseGoal>) => Promise<boolean>;
  updatePurchase: (id: string, patch: Partial<PurchaseGoal>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;

  commitments: UpcomingCommitment[];
  addCommitment: (c: Omit<UpcomingCommitment, "id">) => Promise<boolean>;
  updateCommitment: (id: string, patch: Partial<UpcomingCommitment>) => Promise<boolean>;
  deleteCommitment: (id: string) => Promise<boolean>;

  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null);

export const monthKey = (d: Date | string) => format(new Date(d), "MMMM yyyy");

const byDateDesc = (a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime();

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [budgets, setBudgets] = React.useState<StoredBudget[]>([]);
  const [goals, setGoals] = React.useState<FinancialGoal[]>([]);
  const [purchases, setPurchases] = React.useState<PurchaseGoal[]>([]);
  const [commitments, setCommitments] = React.useState<UpcomingCommitment[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState(() => monthKey(new Date()));
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const handleAuthFailure = React.useCallback(
    (err: unknown) => {
      if (err instanceof ApiClientError && err.status === 401) {
        toast.error("Session expired", { description: err.message });
        router.replace("/login");
        return true;
      }
      return false;
    },
    [router]
  );

  const load = React.useCallback(async () => {
    setLoadError(null);
    try {
      const fetchAll = () =>
        api<{
          user: UserProfile;
          transactions: Transaction[];
          budgets: StoredBudget[];
          goals: FinancialGoal[];
          purchases: PurchaseGoal[];
          commitments: UpcomingCommitment[];
        }>("/bootstrap");
      // One quiet retry covers a database that is still waking up.
      const data = await fetchAll().catch((err) => {
        if (err instanceof ApiClientError && err.status === 401) throw err;
        return new Promise<Awaited<ReturnType<typeof fetchAll>>>((r) => setTimeout(() => r(fetchAll()), 1500));
      });
      const { user: me, transactions: txns, budgets: bgs, goals: gls, purchases: prs, commitments: cms } = data;
      setUser(me);
      setTransactions(txns);
      setBudgets(bgs);
      setGoals(gls);
      setPurchases(prs);
      setCommitments(cms);
    } catch (err) {
      if (handleAuthFailure(err)) return;
      const message = err instanceof Error ? err.message : "Could not load your data.";
      setLoadError(message);
      toast.error("Couldn't load your data", { description: message });
    }
  }, [handleAuthFailure]);

  React.useEffect(() => {
    // Initial fetch of the signed-in user's data; state is set once the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const run = React.useCallback(
    async <R,>(
      action: () => Promise<R>,
      success: string | ((result: R) => string),
      failure: string,
      description?: string | ((result: R) => string)
    ) => {
      try {
        const result = await action();
        const title = typeof success === "function" ? success(result) : success;
        const desc = typeof description === "function" ? description(result) : description;
        toast.success(title, desc ? { description: desc } : undefined);
        return true;
      } catch (err) {
        if (handleAuthFailure(err)) return false;
        toast.error(failure, { description: err instanceof Error ? err.message : undefined });
        return false;
      }
    },
    [handleAuthFailure]
  );

  function crud<T extends { id: string }, New>(
    path: string,
    list: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    label: string,
    describe: (item: T) => string,
    sort?: (a: T, b: T) => number
  ) {
    const apply = (fn: (prev: T[]) => T[]) => setter((prev) => (sort ? fn(prev).sort(sort) : fn(prev)));
    return {
      add: (data: New) =>
        run(
          async () => {
            const created = await api<T>(path, { method: "POST", body: data });
            apply((prev) => [...prev, created]);
            return created;
          },
          `${label} added`,
          `Couldn't add ${label.toLowerCase()}`,
          describe
        ),
      update: (id: string, patch: Partial<T>, message?: string) =>
        run(
          async () => {
            const updated = await api<T>(`${path}/${id}`, { method: "PATCH", body: patch });
            apply((prev) => prev.map((x) => (x.id === id ? updated : x)));
            return updated;
          },
          message ?? `${label} updated`,
          `Couldn't update ${label.toLowerCase()}`,
          describe
        ),
      remove: (id: string) =>
        run(
          async () => {
            const removed = list.find((x) => x.id === id);
            await api(`${path}/${id}`, { method: "DELETE" });
            apply((prev) => prev.filter((x) => x.id !== id));
            return removed;
          },
          `${label} deleted`,
          `Couldn't delete ${label.toLowerCase()}`,
          (removed) => (removed ? describe(removed) : "")
        ),
    };
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  const txnCrud = crud<Transaction, Omit<Transaction, "id">>("/transactions", transactions, setTransactions, "Transaction", (t) => `${t.title} — ${t.type === "income" ? "+" : "-"}${fmt(t.amount)}`, byDateDesc);
  const budgetCrud = crud<StoredBudget, Omit<StoredBudget, "id">>("/budgets", budgets, setBudgets, "Budget", (b) => `${b.category} — ${fmt(b.budgeted)} / month`);
  const goalCrud = crud<FinancialGoal, NewOf<FinancialGoal>>("/goals", goals, setGoals, "Goal", (g) => `${g.name} — target ${fmt(g.goalAmount)}`);
  const purchaseCrud = crud<PurchaseGoal, NewOf<PurchaseGoal>>("/purchases", purchases, setPurchases, "Wishlist item", (p) => `${p.name} — ${fmt(p.price)}`);
  const commitCrud = crud<UpcomingCommitment, Omit<UpcomingCommitment, "id">>("/commitments", commitments, setCommitments, "Commitment", (c) => `${c.title} — ${fmt(c.amount)}`, (a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));

  const budgetCategories = React.useMemo<BudgetCategory[]>(() => {
    const spentBy = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && monthKey(t.date) === selectedMonth)
        spentBy.set(t.category, (spentBy.get(t.category) ?? 0) + t.amount);
    }
    return budgets.map((b) => ({ ...b, spent: spentBy.get(b.category) ?? 0 }));
  }, [budgets, transactions, selectedMonth]);

  if (!user) {
    return <FullPageLoader error={loadError} onRetry={load} />;
  }

  const value: FinanceContextValue = {
    user,
    updateUser: (patch, message = "Profile updated") =>
      run(async () => setUser(await api<UserProfile>("/profile", { method: "PATCH", body: patch })), message, "Couldn't save changes"),
    changePassword: (currentPassword, newPassword) =>
      run(() => api("/profile/password", { method: "PATCH", body: { currentPassword, newPassword } }), "Password changed", "Couldn't change password"),
    deleteAccount: async (password) => {
      const ok = await run(() => api("/profile", { method: "DELETE", body: { password } }), "Account deleted", "Couldn't delete account", "All your data has been permanently removed.");
      if (ok) router.replace("/register");
      return ok;
    },
    signOut: async () => {
      await run(() => api("/auth/logout", { method: "POST" }), "Signed out", "Couldn't sign out", "See you next time!");
      router.replace("/login");
      router.refresh();
    },

    transactions,
    addTransaction: txnCrud.add,
    updateTransaction: txnCrud.update,
    deleteTransaction: txnCrud.remove,

    budgetCategories,
    addBudgetCategory: budgetCrud.add,
    updateBudgetCategory: budgetCrud.update,
    deleteBudgetCategory: budgetCrud.remove,

    goals,
    addGoal: goalCrud.add,
    updateGoal: goalCrud.update,
    deleteGoal: goalCrud.remove,

    purchases,
    addPurchase: purchaseCrud.add,
    updatePurchase: purchaseCrud.update,
    deletePurchase: purchaseCrud.remove,

    commitments,
    addCommitment: commitCrud.add,
    updateCommitment: commitCrud.update,
    deleteCommitment: commitCrud.remove,

    selectedMonth,
    setSelectedMonth,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
