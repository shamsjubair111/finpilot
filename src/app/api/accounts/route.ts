import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { limitCheck } from "@/lib/server/plan-limits";
import { accountSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.account, accountSchema, { createdAt: "asc" }, limitCheck("accounts"));
