import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { transactionSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.transaction, transactionSchema, { date: "desc" });
