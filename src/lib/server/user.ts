import "server-only";
import type { User } from "@/generated/prisma/client";
import { effectivePlan } from "@/lib/plans";
import { isAdminEmail } from "./admin";

export function toProfile(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? undefined,
    currency: u.currency as import("@/types/finance").Currency,
    monthlySalary: u.monthlySalary,
    currentSavings: u.currentSavings,
    emergencyFundTarget: u.emergencyFundTarget,
    emergencyFundCurrent: u.emergencyFundCurrent,
    defaultSavingsTarget: u.defaultSavingsTarget,
    memberSince: u.createdAt.toISOString(),
    language: u.language === "bn" ? ("bn" as const) : ("en" as const),
    emailVerified: !!u.emailVerifiedAt,
    onboarded: !!u.onboardedAt,
    isAdmin: isAdminEmail(u.email),
    weeklySummary: u.weeklySummary,
    twoFactorEnabled: !!u.totpEnabledAt,
    passwordSet: u.passwordSet,
    googleLinked: !!u.googleId,
    recoveryCodesLeft: u.totpEnabledAt ? u.recoveryCodes.length : 0,
    plan: effectivePlan(u.plan, u.planExpiresAt),
    planExpiresAt: u.plan === "pro" && u.planExpiresAt ? u.planExpiresAt.toISOString() : undefined,
  };
}
