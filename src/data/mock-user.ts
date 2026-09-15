import type { UserProfile } from "@/types/finance";

// Central mock user record. Replace with an API call (e.g. GET /api/me)
// when the backend is ready — the shape (UserProfile) stays the same.
export const mockUser: UserProfile = {
  name: "Jubair",
  email: "jubair@finpilot.app",
  avatarUrl: undefined,
  currency: "BDT",
  monthlySalary: 66000,
  currentSavings: 120000,
  emergencyFundTarget: 180000,
  emergencyFundCurrent: 95000,
  defaultSavingsTarget: 15000,
  memberSince: "2024-03-01",
};
