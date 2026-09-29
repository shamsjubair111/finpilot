import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { limitCheck } from "@/lib/server/plan-limits";
import { purchaseSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.purchase, purchaseSchema, { createdAt: "asc" }, limitCheck("purchases"));
