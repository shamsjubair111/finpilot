import "server-only";
import { ApiError } from "./api";
import { db } from "./db";

/** A goal can only follow one of the household's own accounts. */
export async function checkGoalAccount(data: Record<string, unknown>, userId: string) {
  if (typeof data.accountId === "string" && !(await db.account.count({ where: { id: data.accountId, userId } })))
    throw new ApiError(400, "Selected account was not found.");
}
