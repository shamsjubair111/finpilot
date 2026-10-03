import { z } from "zod";
import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { sendEmailQuietly } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({
  topic: z.enum(["question", "bug", "billing", "feature", "other"]),
  message: z.string().trim().min(10, "must be at least 10 characters").max(4000),
  page: z.string().max(200).optional(),
});

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const POST = authed(async ({ actorId, req }) => {
  await rateLimit("support", 5, 60 * 60 * 1000, actorId);
  const { topic, message, page } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: actorId }, select: { email: true, name: true, plan: true } });
  const saved = await db.supportMessage.create({ data: { userId: actorId, email: user.email, name: user.name, topic, message, page: page ?? null } });
  // Also forward to the support inbox when one is configured; the admin dashboard always has it.
  const inbox = process.env.SUPPORT_INBOX || process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (inbox)
    sendEmailQuietly({
      to: inbox,
      subject: `[Sanchay ${topic}] ${user.name} <${user.email}>`,
      text: `${message}\n\nFrom: ${user.name} <${user.email}> (${user.plan})\nPage: ${page ?? "-"}\nID: ${saved.id}`,
      html: `<p>${escape(message).replace(/\n/g, "<br>")}</p><p style="color:#6b7280">From: ${escape(user.name)} &lt;${escape(user.email)}&gt; (${user.plan})<br>Page: ${escape(page ?? "-")}<br>ID: ${saved.id}</p>`,
    });
  return json({ ok: true }, 201);
});
