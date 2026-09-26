import "server-only";
import type { User } from "@/generated/prisma/client";

export function toProfile(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? undefined,
    currency: u.currency,
    monthlySalary: u.monthlySalary,
    currentSavings: u.currentSavings,
    emergencyFundTarget: u.emergencyFundTarget,
    emergencyFundCurrent: u.emergencyFundCurrent,
    defaultSavingsTarget: u.defaultSavingsTarget,
    memberSince: u.createdAt.toISOString(),
  };
}
