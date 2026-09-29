import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { investmentSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.investment, investmentSchema);
