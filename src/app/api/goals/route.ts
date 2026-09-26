import { db } from "@/lib/server/db";
import { collectionRoutes } from "@/lib/server/crud";
import { goalSchema } from "@/lib/validation";

export const { GET, POST } = collectionRoutes(db.goal, goalSchema, { createdAt: "asc" });
