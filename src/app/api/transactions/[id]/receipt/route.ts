import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";

const MAX_BYTES = 600 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

/** Identify the image from its first bytes; the declared Content-Type isn't trusted. */
function sniff(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

async function ownedTransaction(id: string, userId: string) {
  const txn = await db.transaction.findFirst({ where: { id, userId }, select: { id: true } });
  if (!txn) throw new ApiError(404, "Not found. It may have already been deleted.");
  return txn;
}

export const GET = authed<{ id: string }>(
  async ({ userId, params }) => {
    await ownedTransaction(params.id, userId);
    const receipt = await db.receipt.findUnique({ where: { transactionId: params.id } });
    if (!receipt) throw new ApiError(404, "Not found. It may have already been deleted.");
    return new Response(new Uint8Array(receipt.data), {
      headers: {
        "Content-Type": receipt.mime,
        "Content-Length": String(receipt.size),
        "Cache-Control": "private, max-age=3600",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
  { scope: "ledger" }
);

export const PUT = authed<{ id: string }>(
  async ({ userId, actorId, req, params }) => {
    await rateLimit("receipt-upload", 60, 60 * 60 * 1000, actorId);
    await ownedTransaction(params.id, userId);
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) throw new ApiError(400, "Choose a photo to upload.");
    if (buf.length > MAX_BYTES) throw new ApiError(413, "That photo is too large. Try a smaller one.");
    const mime = sniff(buf);
    if (!mime) throw new ApiError(415, "Only JPEG, PNG or WebP photos are supported.");
    const used = await db.receipt.aggregate({ where: { userId, NOT: { transactionId: params.id } }, _sum: { size: true } });
    if ((used._sum.size ?? 0) + buf.length > MAX_TOTAL_BYTES) throw new ApiError(413, "Receipt storage is full. Remove some older receipts first.");
    await db.receipt.upsert({
      where: { transactionId: params.id },
      create: { userId, transactionId: params.id, mime, size: buf.length, data: buf },
      update: { mime, size: buf.length, data: buf, createdAt: new Date() },
    });
    return json({ ok: true, size: buf.length });
  },
  { scope: "ledger" }
);

export const DELETE = authed<{ id: string }>(
  async ({ userId, params }) => {
    await ownedTransaction(params.id, userId);
    await db.receipt.deleteMany({ where: { transactionId: params.id } });
    return json({ ok: true });
  },
  { scope: "ledger" }
);
