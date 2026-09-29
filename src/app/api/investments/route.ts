import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { investmentSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.investment, investmentSchema, { startDate: "asc" });
