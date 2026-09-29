import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { checkCommitment } from "@/lib/server/recurring";
import { commitmentSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.commitment, commitmentSchema, { dueDate: "asc" }, checkCommitment);
