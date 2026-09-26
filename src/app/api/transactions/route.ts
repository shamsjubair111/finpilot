import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { checkTransaction } from "@/lib/server/transaction-check";
import { transactionSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.transaction, transactionSchema, { date: "desc" }, checkTransaction);
