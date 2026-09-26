import { z } from "zod";

const money = z.coerce.number().finite().min(0, "must be 0 or more").max(1e12, "is too large");
const positiveMoney = z.coerce.number().finite().gt(0, "must be greater than 0").max(1e12, "is too large");
const text = (max = 120) => z.string().trim().min(1, "is required").max(max, `must be ${max} characters or fewer`);
const optionalText = (max = 500) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const date = z.coerce.date({ error: "must be a valid date" });
const priority = z.enum(["high", "medium", "low"]);

export const registerSchema = z.object({
  name: text(60),
  email: z.email("must be a valid email").trim().toLowerCase(),
  password: z.string().min(8, "must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email("must be a valid email").trim().toLowerCase(),
  password: z.string().min(1, "is required"),
});

export const profileSchema = z
  .object({
    name: text(60),
    email: z.email("must be a valid email").trim().toLowerCase(),
    avatarUrl: z.url("must be a valid URL").optional().nullable().or(z.literal("")).transform((v) => v || null),
    currency: z.enum(["BDT", "USD", "EUR", "GBP"]),
    monthlySalary: money,
    currentSavings: money,
    emergencyFundTarget: money,
    emergencyFundCurrent: money,
    defaultSavingsTarget: z.coerce.number().min(0).max(100),
  })
  .partial();

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "is required"),
  newPassword: z.string().min(8, "must be at least 8 characters").max(128),
});

export const transactionSchema = z.object({
  title: text(),
  merchant: z.string().trim().max(120).default(""),
  category: text(40),
  date,
  amount: positiveMoney,
  type: z.enum(["income", "expense"]),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "mobile_banking", "other"]).default("card"),
  notes: optionalText(),
});

export const budgetSchema = z.object({
  category: text(40),
  budgeted: positiveMoney,
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
});
