import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { limitCheck } from "@/lib/server/plan-limits";
import { checkGoalAccount } from "@/lib/server/goal-check";
import { goalSchema } from "@/lib/validation";

const checkLimit = limitCheck("goals");

export const { GET, POST } = collectionRoutes(db.goal, goalSchema, { createdAt: "asc" }, async (data, userId) => {
  await checkLimit(data, userId);
  await checkGoalAccount(data, userId);
});
