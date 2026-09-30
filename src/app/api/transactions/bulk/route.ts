import { z } from "zod";
import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete"), ids: z.array(z.string().min(1).max(64)).min(1).max(1000) }),
  z.object({
    action: z.literal("categorize"),
    ids: z.array(z.string().min(1).max(64)).min(1).max(1000),
    category: z.string().trim().min(1).max(40),
    // Only rows of this type change, so an income category never lands on an expense.
    type: z.enum(["income", "expense"]),
  }),
]);

export const POST = authed(
  async ({ userId, req }) => {
    const body = schema.parse(await req.json());
    const where = { userId, id: { in: body.ids } };
    if (body.action === "delete") {
      const { count } = await db.transaction.deleteMany({ where });
      return json({ count });
    }
    const { count } = await db.transaction.updateMany({ where: { ...where, type: body.type }, data: { category: body.category } });
    return json({ count });
  },
  { scope: "ledger" }
);
