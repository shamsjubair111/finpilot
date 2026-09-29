import { describe, expect, it } from "vitest";
import { parseSms, parseSmsBatch, splitMessages } from "@/lib/sms-parser";

const now = new Date(2026, 8, 29, 10, 0);

describe("parseSms", () => {
  it("parses bKash received money", () => {
    const p = parseSms("You have received Tk 1,500.00 from 01712345678. Ref rent. Fee Tk 0.00. Balance Tk 3,250.50. TrxID 9IT4ABCD12 at 28/09/2026 14:35", now)!;
    expect(p).toMatchObject({ provider: "bkash", type: "income", amount: 1500, fee: 0, txnId: "9IT4ABCD12", counterparty: "01712345678", title: "bKash Received" });
    expect(new Date(p.date).getDate()).toBe(28);
    expect(new Date(p.date).getHours()).toBe(14);
  });

  it("parses bKash send money with fee", () => {
    const p = parseSms("Send Money Tk 500.00 to 01898765432 successful. Ref gift. Fee Tk 5.00. Balance Tk 2,745.50. TrxID 9IT5XYZ789 at 29/09/2026 09:10", now)!;
    expect(p).toMatchObject({ type: "expense", kind: "Send Money", amount: 500, fee: 5, counterparty: "01898765432" });
  });

  it("parses bKash cash out and payment", () => {
    expect(parseSms("Cash Out Tk 2,000.00 to 01611111111 successful. Fee Tk 37.00. Balance Tk 708.50. TrxID 9IT6CASH01 at 29/09/2026 11:00", now)).toMatchObject({ kind: "Cash Out", type: "expense", fee: 37 });
    expect(parseSms("Payment Tk 850.00 to Daraz Bangladesh is successful. Balance Tk 1,000.00. TrxID 9IT7PAY001 at 29/09/2026 12:00", now)).toMatchObject({ kind: "Payment", category: "Shopping", counterparty: "Daraz Bangladesh" });
  });

  it("parses recharge as a bill", () => {
    expect(parseSms("Mobile Recharge Tk 50.00 to 01712345678 successful. Balance Tk 950.00. TrxID 9IT8REC001 at 29/09/2026 13:00", now)).toMatchObject({ category: "Bills", type: "expense" });
  });

  it("parses Nagad messages", () => {
    const p = parseSms("Money Received. Amount: Tk 3000.00 Sender: 01555555555 Ref: N/A TxnID: 73ABCD9K Balance: Tk 4500.00 27/09/2026 18:45", now)!;
    expect(p).toMatchObject({ provider: "nagad", type: "income", amount: 3000, txnId: "73ABCD9K", counterparty: "01555555555" });
  });

  it("parses bank debit and credit alerts", () => {
    expect(parseSms("Your A/C XXXX1234 has been debited by BDT 1,250.00 on 25-Sep-26 for POS purchase. Avl Bal BDT 20,000.00", now)).toMatchObject({ provider: "bank", type: "expense", amount: 1250, paymentMethod: "bank_transfer" });
    const c = parseSms("Your A/C XXXX1234 has been credited with BDT 55,000.00 as SALARY on 25-Sep-26.", now)!;
    expect(c).toMatchObject({ type: "income", category: "Salary", amount: 55000 });
    expect(new Date(c.date).getMonth()).toBe(8);
  });

  it("ignores OTPs and messages without an amount", () => {
    expect(parseSms("Your bKash verification code is 123456. Do not share it.", now)).toBeNull();
    expect(parseSms("Hello there", now)).toBeNull();
  });

  it("falls back to now when no date is present", () => {
    expect(parseSms("Send Money Tk 100 to 01700000000 successful.", now)!.date).toBe(now.toISOString());
  });
});

describe("batch", () => {
  it("splits on blank lines and on one-message-per-line pastes", () => {
    expect(splitMessages("a Tk 1\nmore\n\nb Tk 2")).toHaveLength(2);
    expect(splitMessages("Send Money Tk 1 to x\nCash Out Tk 2 to y")).toHaveLength(2);
  });

  it("separates parsed from skipped", () => {
    const { parsed, skipped } = parseSmsBatch("Send Money Tk 100 to 01700000000 successful. TrxID ABC123456\n\nYour OTP is 1234", now);
    expect(parsed).toHaveLength(1);
    expect(skipped).toHaveLength(1);
  });
});
