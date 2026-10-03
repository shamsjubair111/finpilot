import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { CATEGORY_ICON_MAP } from "@/lib/constants";
import { categoryColor } from "@/lib/chart-colors";

interface SampleIds {
  accounts: string[];
  budgets: string[];
  goals: string[];
  commitments: string[];
}

const at = (monthsAgo: number, day: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 12);
  return d > now ? new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1), 12) : d;
};

/** The next time this day of the month comes round (today counts). */
const nextOn = (day: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + (day >= now.getDate() ? 0 : 1), day, 12);
};

/** Seeds three months of realistic example data; returns false if the user already has sample data. */
export async function addSampleData(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { sampleData: true } });
  if (user.sampleData) return false;

  await db.$transaction(async (tx) => {
    const bank = await tx.account.create({ data: { userId, name: "City Bank (sample)", type: "bank", institution: "Sample data", openingBalance: 45000, color: "#4f46e5" } });
    const bkash = await tx.account.create({ data: { userId, name: "bKash (sample)", type: "bkash", institution: "Sample data", openingBalance: 3000, color: "#e2136e" } });
    const ids: SampleIds = { accounts: [bank.id, bkash.id], budgets: [], goals: [], commitments: [] };

    const rows: { title: string; merchant: string; category: string; amount: number; type: "income" | "expense"; day: number; account: string; method: string }[] = [
      { title: "Salary", merchant: "Employer", category: "Salary", amount: 65000, type: "income", day: 1, account: bank.id, method: "bank_transfer" },
      { title: "House rent", merchant: "Landlord", category: "Housing", amount: 18000, type: "expense", day: 3, account: bank.id, method: "bank_transfer" },
      { title: "Monthly bazar", merchant: "Shwapno", category: "Food", amount: 7500, type: "expense", day: 6, account: bank.id, method: "card" },
      { title: "Electricity bill", merchant: "DESCO", category: "Bills", amount: 2100, type: "expense", day: 9, account: bkash.id, method: "mobile_banking" },
      { title: "Internet", merchant: "Link3", category: "Bills", amount: 1200, type: "expense", day: 10, account: bkash.id, method: "mobile_banking" },
      { title: "Pathao rides", merchant: "Pathao", category: "Transport", amount: 1800, type: "expense", day: 14, account: bkash.id, method: "mobile_banking" },
      { title: "Dinner out", merchant: "Star Kabab", category: "Food", amount: 1600, type: "expense", day: 17, account: bkash.id, method: "mobile_banking" },
      { title: "Daraz order", merchant: "Daraz", category: "Shopping", amount: 2900, type: "expense", day: 21, account: bank.id, method: "card" },
      { title: "Pharmacy", merchant: "Lazz Pharma", category: "Health", amount: 850, type: "expense", day: 24, account: bkash.id, method: "mobile_banking" },
    ];
    const data = [2, 1, 0].flatMap((m) =>
      rows.map((r, i) => ({
        userId,
        title: r.title,
        merchant: r.merchant,
        category: r.category,
        amount: Math.round(r.amount * (1 + ((i * 7 + m * 3) % 9) / 100)),
        type: r.type,
        date: at(m, r.day),
        accountId: r.account,
        paymentMethod: r.method,
        externalId: `sample:${m}:${i}`,
      }))
    );
    // Top up bKash from the bank each month, as people usually do, so the wallet stays positive.
    const topUps = [2, 1, 0].map((m) => ({
      userId,
      title: "bKash top-up",
      merchant: "",
      category: "Transfer",
      amount: 7000,
      type: "transfer",
      date: at(m, 2),
      accountId: bank.id,
      toAccountId: bkash.id,
      paymentMethod: "bank_transfer",
      externalId: `sample:${m}:topup`,
    }));
    await tx.transaction.createMany({ data: [...data, ...topUps], skipDuplicates: true });

    for (const [category, budgeted] of [["Housing", 18000], ["Food", 10000], ["Bills", 3500], ["Transport", 2500], ["Shopping", 3000]] as const) {
      const existing = await tx.budgetCategory.findFirst({ where: { userId, category } });
      if (existing) continue;
      const b = await tx.budgetCategory.create({ data: { userId, category, budgeted, icon: CATEGORY_ICON_MAP[category] ?? "Wallet", color: categoryColor(category) } });
      ids.budgets.push(b.id);
    }
    const goal = await tx.goal.create({
      data: { userId, name: "Emergency fund (sample)", goalAmount: 200000, currentAmount: 60000, monthlyContribution: 8000, targetDate: at(-18, 1), priority: "high", category: "emergency", icon: "ShieldCheck" },
    });
    ids.goals.push(goal.id);
    const c1 = await tx.commitment.create({ data: { userId, title: "Internet bill (sample)", category: "Bills", amount: 1200, dueDate: nextOn(10), recurring: true, frequency: "monthly", anchorDay: 10, icon: "Receipt" } });
    const c2 = await tx.commitment.create({ data: { userId, title: "House rent (sample)", category: "Housing", amount: 18000, dueDate: nextOn(3), recurring: true, frequency: "monthly", anchorDay: 3, icon: "Home" } });
    ids.commitments.push(c1.id, c2.id);
    await tx.user.update({ where: { id: userId }, data: { sampleData: ids as unknown as object } });
  });
  return true;
}

/** Removes exactly what addSampleData created, leaving anything the user added themselves. */
export async function removeSampleData(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { sampleData: true } });
  const ids = user.sampleData as unknown as SampleIds | null;
  await db.$transaction([
    db.transaction.deleteMany({ where: { userId, externalId: { startsWith: "sample:" } } }),
    db.budgetCategory.deleteMany({ where: { userId, id: { in: ids?.budgets ?? [] } } }),
    db.goal.deleteMany({ where: { userId, id: { in: ids?.goals ?? [] } } }),
    db.commitment.deleteMany({ where: { userId, id: { in: ids?.commitments ?? [] } } }),
    db.account.deleteMany({ where: { userId, id: { in: ids?.accounts ?? [] } } }),
    db.user.update({ where: { id: userId }, data: { sampleData: Prisma.DbNull } }),
  ]);
}
