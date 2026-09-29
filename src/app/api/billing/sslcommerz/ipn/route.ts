import { confirmPayment } from "@/lib/server/payments";

// Server-to-server notification: credits the payment even if the user closed the browser.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const valId = String(form?.get("val_id") ?? "");
  if (!valId) return new Response("missing val_id", { status: 400 });
  const result = await confirmPayment(valId, String(form?.get("tran_id") ?? "") || undefined).catch((err) => {
    console.error("[sslcommerz ipn]", err);
    return { ok: false as const };
  });
  return new Response(result.ok ? "OK" : "IGNORED", { status: 200 });
}
