import { appUrl } from "@/lib/server/email";
import { confirmPayment } from "@/lib/server/payments";

// SSLCommerz posts the browser here after payment. We re-validate with SSLCommerz before crediting.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const valId = String(form?.get("val_id") ?? "");
  const tranId = String(form?.get("tran_id") ?? "");
  const result = await confirmPayment(valId, tranId).catch((err) => {
    console.error("[sslcommerz success]", err);
    return { ok: false as const };
  });
  return Response.redirect(`${await appUrl()}/billing?payment=${result.ok ? "success" : "failed"}`, 303);
}
