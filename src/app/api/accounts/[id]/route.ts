import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { accountSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.account, accountSchema);
