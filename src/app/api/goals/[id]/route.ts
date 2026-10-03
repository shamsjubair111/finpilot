import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { checkGoalAccount } from "@/lib/server/goal-check";
import { goalSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.goal, goalSchema, checkGoalAccount);
