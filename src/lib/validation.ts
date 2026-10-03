import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currency";
import { FREQUENCIES } from "@/lib/recurrence";
import { INVESTMENT_KINDS, PAYOUTS } from "@/lib/calculations/investments";

// Amounts are stored as floats, so round to cents on the way in to stop drift from accumulating.
export const roundMoney = (v: number) => Math.round(v * 100) / 100;
const money = z.coerce.number().finite().min(0, "must be 0 or more").max(1e12, "is too large").transform(roundMoney);
const positiveMoney = z.coerce.number().finite().min(0.01, "must be greater than 0").max(1e12, "is too large").transform(roundMoney);
const text = (max = 120) => z.string().trim().min(1, "is required").max(max, `must be ${max} characters or fewer`);
const optionalText = (max = 500) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const date = z.coerce.date({ error: "must be a valid date" });
const priority = z.enum(["high", "medium", "low"]);

export const registerSchema = z.object({
  name: text(60),
  email: z.email("must be a valid email").trim().toLowerCase(),
  password: z.string().min(8, "must be at least 8 characters").max(128),
  language: z.enum(["en", "bn"]).default("en"),
  currency: z.enum(CURRENCY_CODES).default("BDT"),
  ref: z.string().trim().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.email("must be a valid email").trim().toLowerCase(),
  password: z.string().min(1, "is required"),
});

export const profileSchema = z
  .object({
    name: text(60),
    avatarUrl: z.url("must be a valid URL").optional().nullable().or(z.literal("")).transform((v) => v || null),
    currency: z.enum(CURRENCY_CODES),
    language: z.enum(["en", "bn"]),
    monthlySalary: money,
    currentSavings: money,
    emergencyFundTarget: money,
    emergencyFundCurrent: money,
    defaultSavingsTarget: z.coerce.number().min(0).max(100),
    weeklySummary: z.boolean(),
    exchangeRates: z.partialRecord(z.enum(CURRENCY_CODES), z.coerce.number().finite().gt(0).max(1e6)),
  })
  .partial();

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "is required"),
  newPassword: z.string().min(8, "must be at least 8 characters").max(128),
});

export const ACCOUNT_TYPES = ["bank", "bkash", "nagad", "rocket", "upay", "e_wallet", "cash", "credit_card", "loan", "savings", "investment", "other"] as const;
export const LIABILITY_TYPES = ["credit_card", "loan"] as const;

const optionalId = z.string().trim().min(1).optional().nullable().transform((v) => v || null);

export const accountSchema = z.object({
  name: text(60),
  type: z.enum(ACCOUNT_TYPES),
  institution: optionalText(80),
  accountNumber: optionalText(40),
  openingBalance: z.coerce.number().finite().min(-1e12).max(1e12).transform(roundMoney).default(0),
  currency: z.enum(CURRENCY_CODES).optional().nullable(),
  creditLimit: z.coerce.number().finite().min(0).max(1e12).transform(roundMoney).optional().nullable(),
  interestRate: z.coerce.number().finite().min(0).max(100).optional().nullable(),
  color: z.string().max(40).optional(),
  archived: z.boolean().optional(),
});

export const transactionSchema = z.object({
  accountId: optionalId,
  toAccountId: optionalId,
  title: text(),
  merchant: z.string().trim().max(120).default(""),
  category: text(40),
  date,
  amount: positiveMoney,
  type: z.enum(["income", "expense", "transfer"]),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "mobile_banking", "other"]).default("card"),
  notes: optionalText(),
  originalAmount: z.coerce.number().finite().min(0.01).max(1e12).transform(roundMoney).optional().nullable(),
  originalCurrency: z.enum(CURRENCY_CODES).optional().nullable(),
  splits: z.array(z.object({ category: text(40), amount: positiveMoney })).max(10).optional().nullable(),
});

export const budgetSchema = z.object({
  category: text(40),
  budgeted: positiveMoney,
  rollover: z.boolean().optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
});

export const goalSchema = z.object({
  name: text(),
  description: optionalText(),
  icon: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
  goalAmount: positiveMoney,
  currentAmount: money.default(0),
  targetDate: date,
  monthlyContribution: money.default(0),
  priority: priority.default("medium"),
  category: z.enum(["emergency", "purchase", "education", "travel", "other"]).default("other"),
  accountId: optionalId,
});

export const purchaseSchema = z.object({
  name: text(),
  price: positiveMoney,
  priority: priority.default("medium"),
  savedAmount: money.default(0),
  desiredDate: date,
  category: z.enum(["Electronics", "Vehicle", "Home", "Travel", "Other"]).default("Other"),
  notes: optionalText(),
});

export const commitmentSchema = z.object({
  title: text(),
  category: text(40).default("Bills"),
  dueDate: date,
  amount: positiveMoney,
  icon: z.string().max(40).optional(),
  recurring: z.boolean().default(false),
  frequency: z.enum(FREQUENCIES).default("monthly"),
  type: z.enum(["income", "expense"]).default("expense"),
  accountId: optionalId,
  autoPost: z.boolean().default(false),
});

export const investmentSchema = z.object({
  name: text(80),
  kind: z.enum(INVESTMENT_KINDS),
  institution: optionalText(80),
  principal: z.coerce.number().finite().min(0).max(1e12).transform(roundMoney).default(0),
  rate: z.coerce.number().finite().min(0).max(100).default(0),
  startDate: date,
  maturityDate: z.coerce.date().optional().nullable(),
  payout: z.enum(PAYOUTS).default("maturity"),
  monthlyDeposit: z.coerce.number().finite().min(0).max(1e10).transform(roundMoney).optional().nullable(),
  currentValue: z.coerce.number().finite().min(0).max(1e12).transform(roundMoney).optional().nullable(),
  notes: optionalText(),
});

const BUILT_IN_CATEGORIES = ["Housing", "Food", "Transport", "Shopping", "Entertainment", "Bills", "Subscriptions", "Health", "Education", "Other", "Salary", "Freelance", "Bonus", "Investment", "Transfer"];

export const customCategorySchema = z.object({
  name: text(30).refine((n) => !BUILT_IN_CATEGORIES.some((b) => b.toLowerCase() === n.toLowerCase()), "already exists as a built-in category"),
  type: z.enum(["income", "expense"]),
});
