import "server-only";
import { headers } from "next/headers";
import { translate, type Lang } from "@/lib/i18n";

// Sends through Resend's HTTP API when RESEND_API_KEY is set. Without it (local development)
// the message is printed to the server console so links can still be followed.
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Sanchay <onboarding@resend.dev>", to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${await res.text().catch(() => "")}`);
}

/** Fire-and-forget variant for emails that must never block or fail the request that triggers them. */
export function sendEmailQuietly(message: Parameters<typeof sendEmail>[0]) {
  sendEmail(message).catch((err) => console.error("[email]", err));
}

export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(lang: Lang, heading: string, paragraphs: string[], action?: { label: string; url: string }) {
  const tr = (s: string) => translate(lang, s);
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#6366f1;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(action.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6b7280">${escapeHtml(tr("If the button doesn't work, copy this link into your browser:"))}<br><span style="word-break:break-all">${escapeHtml(action.url)}</span></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,'Hind Siliguri',sans-serif;color:#111827">
<div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:16px;padding:32px">
<p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#6366f1">${escapeHtml(tr("Sanchay"))}</p>
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(heading)}</h1>${body}${button}
</div><p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">${escapeHtml(tr("You received this email because of activity on your Sanchay account."))}</p></div></body></html>`;
  const text = [heading, "", ...paragraphs, ...(action ? ["", `${action.label}: ${action.url}`] : [])].join("\n");
  return { html, text };
}

export function verificationEmail(lang: Lang, name: string, url: string) {
  const tr = (s: string, v?: Record<string, string | number>) => translate(lang, s, v);
  return {
    subject: tr("Confirm your email for Sanchay"),
    ...layout(lang, tr("Hi {name}, please confirm your email", { name }), [tr("Confirm your email address so you can recover your account if you ever forget your password. This link expires in 24 hours.")], { label: tr("Confirm email"), url }),
  };
}

export function resetEmail(lang: Lang, name: string, url: string) {
  const tr = (s: string, v?: Record<string, string | number>) => translate(lang, s, v);
  return {
    subject: tr("Reset your Sanchay password"),
    ...layout(lang, tr("Reset your password"), [tr("Hi {name}, we received a request to reset your password. This link expires in 1 hour.", { name }), tr("If you didn't ask for this, you can ignore this email — your password won't change.")], { label: tr("Choose a new password"), url }),
  };
}

export function welcomeEmail(lang: Lang, name: string, verifyUrl: string | null, trialDays: number, openUrl?: string) {
  const tr = (s: string, v?: Record<string, string | number>) => translate(lang, s, v);
  const lines = [
    tr("Your account is ready, and you have {n} days of Pro free.", { n: trialDays }),
    tr("Add your accounts, paste a few bKash or bank SMS to import transactions, and set a budget — it takes about two minutes."),
    ...(verifyUrl ? [tr("Please confirm your email address so you can recover your account if you ever forget your password.")] : []),
  ];
  return {
    subject: tr("Welcome to Sanchay"),
    ...layout(lang, tr("Welcome, {name}!", { name }), lines, verifyUrl ? { label: tr("Confirm email"), url: verifyUrl } : { label: tr("Open Sanchay"), url: openUrl ?? "" }),
  };
}

export function reminderEmail(lang: Lang, name: string, items: { title: string; amount: string; due: string }[], url: string) {
  const tr = (s: string, v?: Record<string, string | number>) => translate(lang, s, v);
  return {
    subject: tr("Upcoming payments on Sanchay"),
    ...layout(
      lang,
      tr("Hi {name}, you have payments coming up", { name }),
      items.map((i) => tr("{title}: {amount}, due {date}", { title: i.title, amount: i.amount, date: i.due })),
      { label: tr("View bills"), url }
    ),
  };
}

export function weeklySummaryEmail(
  lang: Lang,
  name: string,
  s: { income: string; expenses: string; top: string[]; overBudget: string[]; billsDue: string | null },
  url: string
) {
  const tr = (x: string, v?: Record<string, string | number>) => translate(lang, x, v);
  const lines = [
    tr("Last 7 days: {income} in, {expenses} out.", { income: s.income, expenses: s.expenses }),
    ...(s.top.length ? [tr("Most spent on: {list}.", { list: s.top.join(", ") })] : []),
    ...(s.overBudget.length ? [tr("Over budget this month: {list}.", { list: s.overBudget.join(", ") })] : []),
    ...(s.billsDue ? [tr("Bills due in the next 7 days: {amount}.", { amount: s.billsDue })] : []),
    tr("You can turn off these emails in Settings."),
  ];
  return { subject: tr("Your week with Sanchay"), ...layout(lang, tr("Hi {name}, here's your week", { name }), lines, { label: tr("Open Sanchay"), url }) };
}
