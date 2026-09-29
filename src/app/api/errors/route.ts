import { z } from "zod";
import { json } from "@/lib/server/api";
import { recordError } from "@/lib/server/errors";
import { rateLimit } from "@/lib/server/rate-limit";
import { getSession } from "@/lib/server/session";

const schema = z.object({ message: z.string().max(500), stack: z.string().max(4000).optional(), path: z.string().max(300).optional() });

// Browsers report crashes caught by error boundaries here.
export async function POST(req: Request) {
  try {
    await rateLimit("client-errors", 20, 60 * 60 * 1000);
    const body = schema.parse(await req.json());
    const err = Object.assign(new Error(body.message), { stack: body.stack });
    await recordError("client", err, { path: body.path, userId: (await getSession())?.userId });
  } catch {
    // Reporting is best-effort; never error back to a crashing page.
  }
  return json({ ok: true });
}
