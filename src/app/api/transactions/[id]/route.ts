import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { checkTransaction } from "@/lib/server/transaction-check";
import { transactionSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.transaction, transactionSchema, checkTransaction);
