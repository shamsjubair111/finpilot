import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { commitmentSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.commitment, commitmentSchema, { dueDate: "asc" });
