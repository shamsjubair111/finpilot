import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { limitCheck } from "@/lib/server/plan-limits";
import { budgetSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.budgetCategory, budgetSchema, { createdAt: "asc" }, limitCheck("budgets"));
