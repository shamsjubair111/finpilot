import { db } from "@/lib/server/db";
import { itemRoutes } from "@/lib/server/crud";
import { customCategorySchema } from "@/lib/validation";

// Deleting a category keeps past transactions as they are; they just no longer appear in the pickers.
export const { DELETE } = itemRoutes(db.customCategory, customCategorySchema);
