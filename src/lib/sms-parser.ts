import type { ExpenseCategory, IncomeCategory, PaymentMethod, TransactionType } from "@/types/finance";

export type SmsProvider = "bkash" | "nagad" | "rocket" | "bank" | "unknown";

export interface ParsedSms {
  raw: string;
  provider: SmsProvider;
  type: Exclude<TransactionType, "transfer">;
  kind: string;
  amount: number;
  fee: number;
  counterparty: string;
  txnId: string | null;
  date: string; // ISO
  category: ExpenseCategory | IncomeCategory;
  paymentMethod: PaymentMethod;
  title: string;
}

const AMOUNT = /(?:Tk|BDT|৳)\.?\s*([\d,]+(?:\.\d+)?)/i;
const FEE = /(?:Fee|Charge)\s*:?\s*(?:Tk|BDT|৳)?\.?\s*([\d,]+(?:\.\d+)?)/i;
const TXN_ID = /\b(?:TrxID|TxnID|TxID|Trx\s?ID|Txn\s?ID|Trans(?:action)?\s?ID)\s*[:.]?\s*([A-Z0-9]{6,})/i;
const SKIP = /\b(OTP|verification code|one[- ]time|PIN is|do not share)\b/i;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const num = (s: string) => Number(s.replace(/,/g, ""));
const fullYear = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y));

function parseDate(text: string, now: Date): Date {
  // 29/09/2026 14:30 or 29-09-26 2:30 PM
  let m = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[\sT,]+(?:at\s+)?(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?)?/i);
  if (m) {
    let h = Number(m[4] ?? 12);
    if (m[6]?.toUpperCase() === "PM" && h < 12) h += 12;
    if (m[6]?.toUpperCase() === "AM" && h === 12) h = 0;
    const d = new Date(fullYear(m[3]), Number(m[2]) - 1, Number(m[1]), h, Number(m[5] ?? 0));
    if (!Number.isNaN(d.getTime()) && Number(m[2]) <= 12) return d;
  }
  // 29-Sep-26 or 29 Sep 2026
  m = text.match(/(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{2,4})(?:[\s,]+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const month = MONTHS.indexOf(m[2].toLowerCase());
    if (month >= 0) return new Date(fullYear(m[3]), month, Number(m[1]), Number(m[4] ?? 12), Number(m[5] ?? 0));
  }
  return now;
}

function detectProvider(text: string): SmsProvider {
  if (/\bbkash\b/i.test(text) || /\bTrxID\b/.test(text)) return "bkash";
  if (/\bnagad\b/i.test(text) || /\bTxnID\b/.test(text)) return "nagad";
  if (/\brocket\b|\bDBBL\b/i.test(text)) return "rocket";
  if (/\bA\/?C\b|account|debited|credited|card/i.test(text)) return "bank";
  return "unknown";
}

// Ordered: the first matching rule wins, so specific phrases come before generic ones.
const RULES: { re: RegExp; kind: string; type: ParsedSms["type"]; category: ParsedSms["category"] }[] = [
  { re: /cash\s*in/i, kind: "Cash In", type: "income", category: "Other" },
  { re: /cash\s*out/i, kind: "Cash Out", type: "expense", category: "Other" },
  { re: /(mobile\s*)?recharge|top[\s-]?up/i, kind: "Mobile Recharge", type: "expense", category: "Bills" },
  { re: /pay\s*bill|bill\s*pay|utility/i, kind: "Bill Payment", type: "expense", category: "Bills" },
  { re: /salary/i, kind: "Salary", type: "income", category: "Salary" },
  { re: /refund|cashback/i, kind: "Refund", type: "income", category: "Other" },
  { re: /(money\s+)?received|you have received|credited|deposit/i, kind: "Received", type: "income", category: "Other" },
  { re: /send\s*money|sent|transfer(red)?\s+to|fund\s*transfer/i, kind: "Send Money", type: "expense", category: "Other" },
  { re: /payment|paid|purchase|pos\b|merchant/i, kind: "Payment", type: "expense", category: "Shopping" },
  { re: /debited|withdrawn|withdrawal/i, kind: "Debit", type: "expense", category: "Other" },
];

const PROVIDER_NAMES: Record<SmsProvider, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank", unknown: "" };

function counterpartyOf(text: string) {
  const labelled = text.match(/\b(?:Sender|Receiver|Merchant|Biller|To|From)\s*:\s*([^\n.]+?)(?=\s+(?:Ref|Fee|TxnID|TrxID|Balance|Amount)\b|[.\n]|$)/i);
  if (labelled) return labelled[1].trim();
  const inline = text.match(/\b(?:from|to)\s+(?!your\b)([A-Za-z0-9+][\w&.' -]*?)(?=\s+(?:is\s+)?(?:successful|success|ref|fee|on|at)\b|[.,(]|$)/i);
  return inline ? inline[1].trim() : "";
}

export function parseSms(raw: string, now = new Date()): ParsedSms | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || SKIP.test(text)) return null;
  const amountMatch = text.match(AMOUNT);
  if (!amountMatch) return null;
  const amount = num(amountMatch[1]);
  if (!(amount > 0)) return null;
  const rule = RULES.find((r) => r.re.test(text));
  if (!rule) return null;

  const provider = detectProvider(text);
  const feeMatch = text.match(FEE);
  const fee = feeMatch ? num(feeMatch[1]) : 0;
  const counterparty = counterpartyOf(text);
  const name = PROVIDER_NAMES[provider];

  return {
    raw: raw.trim(),
    provider,
    type: rule.type,
    kind: rule.kind,
    amount: Math.round(amount * 100) / 100,
    fee: Number.isFinite(fee) ? fee : 0,
    counterparty,
    txnId: text.match(TXN_ID)?.[1]?.toUpperCase() ?? null,
    date: parseDate(text, now).toISOString(),
    category: rule.category,
    paymentMethod: provider === "bank" ? "bank_transfer" : provider === "unknown" ? "other" : "mobile_banking",
    title: [name, rule.kind].filter(Boolean).join(" "),
  };
}

/** Splits pasted text into individual messages: blank lines separate them, and so does each new line that carries its own amount. */
export function splitMessages(input: string): string[] {
  return input
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const perLine = lines.length > 1 && lines.every((l) => AMOUNT.test(l));
      return perLine ? lines : [lines.join(" ")];
    })
    .filter(Boolean);
}

export function parseSmsBatch(input: string, now = new Date()) {
  const parsed: ParsedSms[] = [];
  const skipped: string[] = [];
  for (const msg of splitMessages(input)) {
    const p = parseSms(msg, now);
    if (p) parsed.push(p);
    else skipped.push(msg);
  }
  return { parsed, skipped };
}
