import "server-only";

// SSLCommerz (bKash, Nagad, Rocket, cards, internet banking) — v4 session + validation APIs.
export function sslcommerzConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) return null;
  const live = process.env.SSLCOMMERZ_LIVE === "true";
  // SSLCOMMERZ_API_BASE is only for pointing tests at a local stand-in.
  const base = process.env.SSLCOMMERZ_API_BASE ?? (live ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");
  return { storeId, storePassword, base };
}

export async function createSession(params: Record<string, string>) {
  const config = sslcommerzConfig();
  if (!config) throw new Error("SSLCommerz is not configured");
  const res = await fetch(`${config.base}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ store_id: config.storeId, store_passwd: config.storePassword, ...params }),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (data.status !== "SUCCESS" || !data.GatewayPageURL) throw new Error(`SSLCommerz session failed: ${data.failedreason ?? res.status}`);
  return data.GatewayPageURL;
}

export interface Validation {
  status: string;
  tran_id: string;
  amount: string;
  currency: string;
  card_type?: string;
  val_id: string;
}

/** Asks SSLCommerz whether a payment is genuine. Never trust the browser redirect or IPN body on its own. */
export async function validatePayment(valId: string): Promise<Validation | null> {
  const config = sslcommerzConfig();
  if (!config || !valId) return null;
  const url = new URL(`${config.base}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({ val_id: valId, store_id: config.storeId, store_passwd: config.storePassword, format: "json" }).toString();
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as Validation | null;
  return data && (data.status === "VALID" || data.status === "VALIDATED") ? data : null;
}
