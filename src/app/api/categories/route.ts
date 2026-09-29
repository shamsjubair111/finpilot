import { db } from "@/lib/server/db";
import { ApiError } from "@/lib/server/api";
import { collectionRoutes } from "@/lib/server/crud";
import { customCategorySchema } from "@/lib/validation";

const MAX = 40;

export const { GET, POST } = collectionRoutes(db.customCategory, customCategorySchema, { name: "asc" }, async (_data, userId) => {
  if ((await db.customCategory.count({ where: { userId } })) >= MAX) throw new ApiError(400, "You can add up to 40 categories.");
});
