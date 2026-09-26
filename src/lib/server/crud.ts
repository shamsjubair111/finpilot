import "server-only";
import type { ZodObject, ZodRawShape } from "zod";
import { ApiError, authed, json } from "./api";

// Prisma model delegates share this shape; typed loosely so one factory serves every resource.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = Record<"findMany" | "findFirst" | "create" | "update" | "delete", (args: any) => Promise<any>>;

type Row = Record<string, unknown>;

export function serialize(row: Row) {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "userId") continue;
    out[k] = v instanceof Date ? v.toISOString() : v ?? undefined;
  }
  return out;
}

type Check = (data: Row, userId: string, existing?: Row) => Promise<void>;

export function collectionRoutes<S extends ZodRawShape>(
  model: Delegate,
  schema: ZodObject<S>,
  orderBy: Row,
  check?: Check
) {
  return {
    GET: authed(async ({ userId }) => {
      const rows = await model.findMany({ where: { userId }, orderBy });
      return json(rows.map(serialize));
    }),
    POST: authed(async ({ userId, req }) => {
      const data = schema.parse(await req.json()) as Row;
      await check?.(data, userId);
      const row = await model.create({ data: { ...data, userId } });
      return json(serialize(row), 201);
    }),
  };
}

export function itemRoutes<S extends ZodRawShape>(model: Delegate, schema: ZodObject<S>, check?: Check) {
  const owned = async (id: string, userId: string) => {
    const row = await model.findFirst({ where: { id, userId } });
    if (!row) throw new ApiError(404, "Not found. It may have already been deleted.");
    return row;
  };
  return {
    GET: authed<{ id: string }>(async ({ userId, params }) => json(serialize(await owned(params.id, userId)))),
    PATCH: authed<{ id: string }>(async ({ userId, req, params }) => {
      const existing = await owned(params.id, userId);
      const body = await req.json();
      const parsed = schema.partial().parse(body) as Row;
      const data = Object.fromEntries(Object.entries(parsed).filter(([k]) => k in body));
      await check?.(data, userId, existing);
      const row = await model.update({ where: { id: params.id }, data });
      return json(serialize(row));
    }),
    DELETE: authed<{ id: string }>(async ({ userId, params }) => {
      await owned(params.id, userId);
      await model.delete({ where: { id: params.id } });
      return json({ ok: true });
    }),
  };
}
