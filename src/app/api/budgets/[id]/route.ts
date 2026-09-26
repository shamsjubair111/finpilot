import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { budgetSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.budgetCategory, budgetSchema);
