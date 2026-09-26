import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { commitmentSchema } from "@/lib/validation";

export const { GET, PATCH, DELETE } = itemRoutes(db.commitment, commitmentSchema, "Commitment");
