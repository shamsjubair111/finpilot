import "server-only";
import { ApiError } from "./api";

/** Repayments can't exceed the amount lent or borrowed (checked against the stored row on edits). */
export async function personalLoanCheck(data: Record<string, unknown>, _userId: string, existing?: Record<string, unknown>) {
  const amount = Number(data.amount ?? existing?.amount ?? 0);
  const repaid = Number(data.repaid ?? existing?.repaid ?? 0);
  if (repaid > amount) throw new ApiError(400, "Repaid amount can't be more than the loan.");
}
