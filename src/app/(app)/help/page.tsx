"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, LifeBuoy, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "How do I add my bKash or bank transactions quickly?",
    a: "Copy the SMS messages from your phone and paste them on the Import page; Sanchay reads the amount, date and transaction ID. You can also upload a CSV statement from internet banking. Duplicates are skipped automatically.",
    link: { href: "/import", label: "Open Import" },
  },
  {
    q: "Is my financial data safe?",
    a: "Your data is only visible to you and anyone you invite to your household. Sessions are secure, you can turn on two-step verification, and Settings shows recent sign-ins. Sanchay never asks for your bank or bKash PIN.",
    link: { href: "/settings", label: "Security settings" },
  },
  {
    q: "What do I get with Pro, and how do I pay?",
    a: "Pro removes the limits on accounts, goals and budgets, and adds the AI money assistant and household sharing. Pay monthly or yearly with bKash, Nagad, Rocket or a card on the Plan & billing page.",
    link: { href: "/billing", label: "Plan & billing" },
  },
  {
    q: "Can my family use the same finances?",
    a: "Yes. On Pro, invite up to four people from Settings → Household. They sign in with their own account and can either view or also edit.",
  },
  {
    q: "I have a PayPal or Payoneer account in dollars. Can I track it?",
    a: "Yes. When adding the account, choose its currency. Set the exchange rate in Settings so it counts towards your net worth.",
  },
  {
    q: "How do bills and reminders work?",
    a: "Add rent, bills, EMIs and subscriptions on the Bills page. You'll get an email (and a phone notification if you turn it on) before they're due, and one tap marks them paid. Fixed amounts like rent can be recorded automatically.",
    link: { href: "/recurring", label: "Bills & recurring" },
  },
  {
    q: "How do I download or delete my data?",
    a: "Settings → Your data downloads everything as CSV or JSON. Settings → Danger zone permanently deletes your account and all its data.",
  },
];

const TOPICS = [
  { value: "question", label: "A question" },
  { value: "bug", label: "Something isn't working" },
  { value: "billing", label: "Payments and billing" },
  { value: "feature", label: "An idea or request" },
  { value: "other", label: "Something else" },
];

export default function HelpPage() {
  const [topic, setTopic] = React.useState("question");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await api("/support", { method: "POST", body: { topic, message, page: document.referrer ? new URL(document.referrer).pathname : undefined } });
      setSent(true);
      setMessage("");
    } catch (err) {
      toast.error(t("Couldn't send your message"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Help")} subtitle={t("Answers to common questions, and a way to reach us.")} />

      <Card className="mb-6">
        <CardContent className="divide-y pt-2">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {t(f.q)}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.a)}</p>
              {f.link && (
                <Link href={f.link.href} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                  {t(f.link.label)} →
                </Link>
              )}
            </details>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="size-4 text-primary" /> {t("Contact us")}
          </CardTitle>
          <CardDescription>{t("We usually reply within a day, by email.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-sm">
              <p>{t("Thanks — your message has been sent. We'll reply to your account email.")}</p>
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSent(false)}>
                {t("Send another message")}
              </button>
            </div>
          ) : (
            <form onSubmit={send} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="help-topic">{t("What's it about?")}</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="help-topic" className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((x) => (
                      <SelectItem key={x.value} value={x.value}>{t(x.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="help-message">{t("Message")}</Label>
                <Textarea id="help-message" rows={5} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("Tell us what happened or what you need…")} />
              </div>
              <SubmitButton pending={pending} disabled={message.trim().length < 10}>
                <Send className="size-4" />
                {t("Send message")}
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
