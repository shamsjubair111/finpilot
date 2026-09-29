"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type {
  Account,
  BudgetCategory,
  FinancialGoal,
  PurchaseGoal,
  Transaction,
  UpcomingCommitment,
  UserProfile,
} from "@/types/finance";
import { api, ApiClientError } from "@/lib/api-client";
import { computeBalances, netWorthOf } from "@/lib/accounts";
import { t } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, setCurrencyPref } from "@/lib/currency";
import type { Lang } from "@/lib/i18n";
import { FullPageLoader } from "@/components/shared/full-page-loader";

type StoredBudget = Omit<BudgetCategory, "spent">;
type NewOf<T> = Omit<T, "id" | "createdAt">;

interface FinanceContextValue {
  user: UserProfile;
  updateUser: (patch: Partial<UserProfile>, successMessage?: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteUserAccount: (password: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  signOutOtherDevices: () => Promise<boolean>;
  completeOnboarding: (data: {
    profile?: Partial<Pick<UserProfile, "monthlySalary" | "currentSavings" | "emergencyFundTarget">>;
    account?: Pick<Account, "name" | "type" | "openingBalance">;
    budgets?: { category: string; budgeted: number }[];
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  setLanguage: (lang: Lang) => void;

  transactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, "id">) => Promise<boolean>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  importTransactions: (items: Omit<Transaction, "id">[]) => Promise<{ created: number; skipped: number } | null>;

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

  accounts: Account[];
  accountBalances: Map<string, number>;
  netWorth: { assets: number; liabilities: number; netWorth: number };
  addAccount: (a: Omit<Account, "id" | "createdAt">) => Promise<boolean>;
  updateAccount: (id: string, patch: Partial<Account>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;

  commitments: UpcomingCommitment[];
  addCommitment: (c: Omit<UpcomingCommitment, "id">) => Promise<boolean>;
  updateCommitment: (id: string, patch: Partial<UpcomingCommitment>) => Promise<boolean>;
  deleteCommitment: (id: string) => Promise<boolean>;
  payCommitment: (id: string, opts?: { amount?: number; date?: string }) => Promise<boolean>;

  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null);

export const monthKey = (d: Date | string) => format(new Date(d), "MMMM yyyy");

const byDateDesc = (a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime();

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang } = useI18n();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [budgets, setBudgets] = React.useState<StoredBudget[]>([]);
  const [goals, setGoals] = React.useState<FinancialGoal[]>([]);
  const [purchases, setPurchases] = React.useState<PurchaseGoal[]>([]);
  const [commitments, setCommitments] = React.useState<UpcomingCommitment[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState(() => monthKey(new Date()));
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const handleAuthFailure = React.useCallback(
    (err: unknown) => {
      if (err instanceof ApiClientError && err.status === 401) {
        toast.error(t("Session expired"), { description: err.message });
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
          accounts: Account[];
        }>("/bootstrap");
      // One quiet retry covers a database that is still waking up.
      const data = await fetchAll().catch((err) => {
        if (err instanceof ApiClientError && err.status === 401) throw err;
        return new Promise<Awaited<ReturnType<typeof fetchAll>>>((r) => setTimeout(() => r(fetchAll()), 1500));
      });
      const { user: me, transactions: txns, budgets: bgs, goals: gls, purchases: prs, commitments: cms, accounts: acs } = data;
      setAccounts(acs);
      setCurrencyPref(me.currency);
      if (me.language !== lang) setLang(me.language);
      setUser(me);
      setTransactions(txns);
      setBudgets(bgs);
      setGoals(gls);
      setPurchases(prs);
      setCommitments(cms);
    } catch (err) {
      if (handleAuthFailure(err)) return;
      const message = err instanceof Error ? err.message : t("Could not load your data.");
      setLoadError(message);
      toast.error(t("Couldn't load your data"), { description: message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAuthFailure]);

  React.useEffect(() => {
    // Initial fetch of the signed-in user's data; state is set once the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const needsOnboarding = !!user && !user.onboarded && pathname !== "/onboarding";
  React.useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  // The email confirmation link lands on "/?verified=1" (or 0 when the link was bad).
  const signedIn = !!user;
  React.useEffect(() => {
    if (!signedIn) return;
    const verified = new URLSearchParams(window.location.search).get("verified");
    if (verified === null) return;
    if (verified === "1") toast.success(t("Email confirmed"), { description: t("Thanks! Your email address is verified.") });
    else toast.error(t("Confirmation link not valid"), { description: t("It may have expired or already been used. Send a new one from the banner.") });
    router.replace(window.location.pathname);
  }, [signedIn, router]);

  const run = React.useCallback(
    async <R,>(
      action: () => Promise<R>,
      success: string | ((result: R) => string),
      failure: string,
      description?: string | ((result: R) => string)
    ) => {
      try {
        const result = await action();
        const title = t(typeof success === "function" ? success(result) : success);
        const desc = typeof description === "function" ? description(result) : description;
        toast.success(title, desc ? { description: desc } : undefined);
        return true;
      } catch (err) {
        if (handleAuthFailure(err)) return false;
        toast.error(t(failure), { description: err instanceof Error ? err.message : undefined });
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
          t("{item} added", { item: t(label) }),
          t("Couldn't add {item}", { item: t(label).toLowerCase() }),
          describe
        ),
      update: (id: string, patch: Partial<T>, message?: string) =>
        run(
          async () => {
            const updated = await api<T>(`${path}/${id}`, { method: "PATCH", body: patch });
            apply((prev) => prev.map((x) => (x.id === id ? updated : x)));
            return updated;
          },
          message ?? t("{item} updated", { item: t(label) }),
          t("Couldn't update {item}", { item: t(label).toLowerCase() }),
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
          t("{item} deleted", { item: t(label) }),
          t("Couldn't delete {item}", { item: t(label).toLowerCase() }),
          (removed) => (removed ? describe(removed) : "")
        ),
    };
  }

  const fmt = (n: number) => formatCurrency(n);
  const txnCrud = crud<Transaction, Omit<Transaction, "id">>("/transactions", transactions, setTransactions, "Transaction", (t) => `${t.title} — ${t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}${fmt(t.amount)}`, byDateDesc);
  const budgetCrud = crud<StoredBudget, Omit<StoredBudget, "id">>("/budgets", budgets, setBudgets, "Budget", (b) => `${t(b.category)} — ${fmt(b.budgeted)} / ${t("month")}`);
  const goalCrud = crud<FinancialGoal, NewOf<FinancialGoal>>("/goals", goals, setGoals, "Goal", (g) => `${g.name} — ${t("target")} ${fmt(g.goalAmount)}`);
  const purchaseCrud = crud<PurchaseGoal, NewOf<PurchaseGoal>>("/purchases", purchases, setPurchases, "Wishlist item", (p) => `${p.name} — ${fmt(p.price)}`);
  const commitCrud = crud<UpcomingCommitment, Omit<UpcomingCommitment, "id">>("/commitments", commitments, setCommitments, "Commitment", (c) => `${c.title} — ${fmt(c.amount)}`, (a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));

  const accountCrud = crud<Account, Omit<Account, "id" | "createdAt">>("/accounts", accounts, setAccounts, "Account", (a) => a.name);
  const accountBalances = React.useMemo(() => computeBalances(accounts, transactions), [accounts, transactions]);
  const netWorth = React.useMemo(() => netWorthOf(accounts, accountBalances), [accounts, accountBalances]);

  const budgetCategories = React.useMemo<BudgetCategory[]>(() => {
    const spentBy = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && monthKey(t.date) === selectedMonth)
        spentBy.set(t.category, (spentBy.get(t.category) ?? 0) + t.amount);
    }
    return budgets.map((b) => ({ ...b, spent: spentBy.get(b.category) ?? 0 }));
  }, [budgets, transactions, selectedMonth]);

  if (!user || needsOnboarding) {
    return <FullPageLoader error={loadError} onRetry={load} />;
  }
  setCurrencyPref(user.currency);

  const value: FinanceContextValue = {
    user,
    updateUser: (patch, message = "Profile updated") =>
      run(async () => setUser(await api<UserProfile>("/profile", { method: "PATCH", body: patch })), message, "Couldn't save changes"),
    changePassword: (currentPassword, newPassword) =>
      run(() => api("/profile/password", { method: "PATCH", body: { currentPassword, newPassword } }), "Password changed", "Couldn't change password"),
    setLanguage: (next) => {
      setLang(next);
      setUser((u) => (u ? { ...u, language: next } : u));
      api("/profile", { method: "PATCH", body: { language: next } }).catch(() => {});
      toast.success(next === "bn" ? "ভাষা পরিবর্তন করা হয়েছে — বাংলা" : "Language changed — English");
    },
    deleteUserAccount: async (password) => {
      const ok = await run(() => api("/profile", { method: "DELETE", body: { password } }), "Account deleted", "Couldn't delete account", t("All your data has been permanently removed."));
      if (ok) router.replace("/register");
      return ok;
    },
    signOutOtherDevices: () =>
      run(() => api("/auth/logout-all", { method: "POST" }), "Signed out of other devices", "Couldn't sign out other devices", t("Only this device is still signed in.")),
    resendVerification: () =>
      run(() => api("/auth/verify/send", { method: "POST" }), "Confirmation email sent", "Couldn't send email", t("Check your inbox for a link from Sanchay.")),
    completeOnboarding: async (data) => {
      const ok = await run(
        async () => setUser(await api<UserProfile>("/onboarding", { method: "POST", body: data })),
        "You're all set!",
        "Couldn't finish setup"
      );
      // Reload so the new account and budgets appear everywhere.
      if (ok) await load();
      return ok;
    },
    signOut: async () => {
      await run(() => api("/auth/logout", { method: "POST" }), "Signed out", "Couldn't sign out", t("See you next time!"));
      router.replace("/login");
      router.refresh();
    },

    transactions,
    addTransaction: txnCrud.add,
    updateTransaction: txnCrud.update,
    deleteTransaction: txnCrud.remove,
    importTransactions: async (items) => {
      let summary: { created: number; skipped: number } | null = null;
      await run(
        async () => {
          const res = await api<{ created: Transaction[]; skipped: number }>("/transactions/import", { method: "POST", body: { items } });
          setTransactions((prev) => [...res.created, ...prev].sort(byDateDesc));
          summary = { created: res.created.length, skipped: res.skipped };
          return summary;
        },
        (r) => t("Imported {n} transactions", { n: r.created }),
        "Couldn't import transactions",
        (r) => (r.skipped ? t("{n} duplicates were skipped.", { n: r.skipped }) : "")
      );
      return summary;
    },

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

    accounts,
    accountBalances,
    netWorth,
    addAccount: accountCrud.add,
    updateAccount: accountCrud.update,
    deleteAccount: async (id) => {
      const ok = await accountCrud.remove(id);
      if (ok) setTransactions((prev) => prev.map((t) => (t.accountId === id || t.toAccountId === id ? { ...t, accountId: t.accountId === id ? null : t.accountId, toAccountId: t.toAccountId === id ? null : t.toAccountId } : t)));
      return ok;
    },

    commitments,
    addCommitment: commitCrud.add,
    updateCommitment: commitCrud.update,
    deleteCommitment: commitCrud.remove,
    payCommitment: (id, opts = {}) =>
      run(
        async () => {
          const res = await api<{ transaction: Transaction; commitment: UpcomingCommitment | null }>(`/commitments/${id}/pay`, { method: "POST", body: opts });
          setTransactions((prev) => [res.transaction, ...prev].sort(byDateDesc));
          setCommitments((prev) =>
            (res.commitment ? prev.map((c) => (c.id === id ? res.commitment! : c)) : prev.filter((c) => c.id !== id)).sort(
              (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            )
          );
        },
        "Marked as paid",
        "Couldn't record payment",
        t("Added to your transactions.")
      ),

    selectedMonth,
    setSelectedMonth,
  };

  return (
    <FinanceContext.Provider value={value}>
      <React.Fragment key={`${lang}-${user.currency}`}>{children}</React.Fragment>
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
