import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, handleError, requireUserId, resolveLedger } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { rateLimit } from "@/lib/server/rate-limit";
import { buildFinancialSummary, type AssistantData } from "@/lib/assistant-context";
import { effectivePlan } from "@/lib/plans";

const MODEL = "claude-opus-5-5";

// Frozen instructions first so they stay a stable, cacheable prefix; the per-user snapshot follows.
const INSTRUCTIONS = `You are Sanchay's money assistant, helping one person understand and plan their personal finances.
You receive a snapshot of their data below. Base every number you give on that snapshot and say plainly when something isn't in it.
Be practical and specific: use their actual amounts, budgets, bills and goals. Show short calculations when they help.
Keep answers brief and easy to scan — a few sentences or a short list. Use the currency given in the snapshot.
Reply in the same language the user writes in (Bangla or English).
You give general budgeting guidance, not regulated financial, tax or investment advice; for big decisions suggest checking with a qualified adviser.
Never ask for passwords, PINs, OTPs or full account numbers.`;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(30)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", "must start and end with a user message"),
});

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

export async function POST(req: Request) {
  try {
    const actorId = await requireUserId();
    const { ownerId: userId } = await resolveLedger(actorId);
    if (!process.env.ANTHROPIC_API_KEY) throw new ApiError(503, "The AI assistant isn't set up on this server yet.");
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      include: { accounts: true, transactions: { orderBy: { date: "desc" }, take: 2000 }, budgets: true, goals: true, purchases: true, commitments: true, investments: true },
    });
    if (effectivePlan(user.plan, user.planExpiresAt) !== "pro") throw new ApiError(402, "The AI assistant is part of Sanchay Pro.");
    await rateLimit("assistant", 40, 60 * 60 * 1000, actorId);
    const { messages } = bodySchema.parse(await req.json());

    const summary = buildFinancialSummary({
      ...user,
      accounts: user.accounts.map(serialize) as unknown as AssistantData["accounts"],
      transactions: user.transactions.map(serialize) as unknown as AssistantData["transactions"],
      goals: user.goals.map((g) => ({ ...g, targetDate: g.targetDate.toISOString() })),
      purchases: user.purchases.map((p) => ({ ...p, desiredDate: p.desiredDate.toISOString() })),
      commitments: user.commitments.map((c) => ({ ...c, dueDate: c.dueDate.toISOString() })),
      investments: user.investments.map((i) => ({ ...i, kind: i.kind as never, payout: i.payout as never, startDate: i.startDate.toISOString(), maturityDate: i.maturityDate?.toISOString() ?? null })),
    });

    const stream = anthropic().beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      // On a policy decline, Anthropic re-runs the request on its recommended fallback model.
      fallbacks: "default",
      // Chat is latency-sensitive; medium keeps answers thoughtful without long pauses.
      output_config: { effort: "medium" },
      // Automatic caching: follow-up turns in a conversation reuse the instructions + snapshot prefix.
      cache_control: { type: "ephemeral" },
      system: [
        { type: "text", text: INSTRUCTIONS },
        { type: "text", text: `<financial_snapshot>\n${summary}\n</financial_snapshot>` },
      ],
      messages,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(encoder.encode(event.delta.text));
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\nSorry, I can't help with that request."));
          else if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("…"));
        } catch (err) {
          console.error("[assistant]", err);
          controller.enqueue(encoder.encode("\n\n⚠️ The assistant stopped unexpectedly. Please try again."));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });
    return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return handleError(new ApiError(429, "The assistant is busy. Please try again in a minute."));
    if (err instanceof Anthropic.APIError) {
      console.error("[assistant]", err.status, err.message);
      return handleError(new ApiError(502, "The assistant is unavailable right now. Please try again."));
    }
    return handleError(err);
  }
}
