"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Crown, RotateCcw, Sparkles, Square } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Can I afford a ৳45,000 phone this month?",
  "Where did most of my money go this month?",
  "How can I reach my savings goal faster?",
  "Which bills are coming up and can I cover them?",
];

export default function AssistantPage() {
  const { ledger } = useFinance();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const [usage, setUsage] = React.useState<{ used: number; limit: number } | null>(null);
  const refreshUsage = React.useCallback(() => {
    fetch("/api/assistant/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => u && setUsage(u))
      .catch(() => {});
  }, []);
  React.useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const append = (chunk: string) =>
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + chunk };
        return next;
      });
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send completed turns; keep the conversation to the most recent 20 messages.
        body: JSON.stringify({ messages: history.filter((m) => m.content).slice(-20) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        append(data.error ?? t("Something went wrong on our side. Please try again."));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") append(t("Can't reach the server. Check your connection and try again."));
    } finally {
      setBusy(false);
      abortRef.current = null;
      refreshUsage();
    }
  }

  // In a shared household, Pro features follow the owner's plan.
  if (ledger.plan !== "pro")
    return (
      <div>
        <PageHeader title={t("Money assistant")} subtitle={t("Ask questions about your own money and get answers based on your data.")} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Crown className="size-8 text-amber-500" />
            <p className="max-w-sm text-sm text-muted-foreground">{t("The AI assistant is part of Sanchay Pro.")}</p>
            <Button asChild>
              <Link href="/billing">{t("Upgrade to Pro")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <PageHeader
        title={t("Money assistant")}
        subtitle={t("Ask questions about your own money and get answers based on your data.")}
        actions={
          messages.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMessages([])} disabled={busy}>
              <RotateCcw className="size-4" />
              {t("New chat")}
            </Button>
          )
        }
      />

      <div className="flex-1 space-y-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-xl py-8 text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{t("Try one of these:")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(t(s))}
                  className="rounded-xl border bg-card p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card"
                )}
              >
                {m.content || <span className="inline-block animate-pulse text-muted-foreground">{t("Thinking…")}</span>}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-0 mt-4 flex items-end gap-2 bg-background/80 py-3 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={t("Ask about your spending, budgets, goals…")}
          rows={1}
          maxLength={4000}
          className="max-h-40 min-h-11 resize-none"
          aria-label={t("Your question")}
        />
        {busy ? (
          <Button type="button" size="icon" variant="outline" onClick={() => abortRef.current?.abort()} aria-label={t("Stop")}>
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label={t("Send")}>
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>
      <p className="text-center text-[11px] text-muted-foreground">
        {t("Answers are generated by AI from your Sanchay data and can be wrong. Not financial advice.")}
        {usage && ` · ${t("{used} of {limit} messages this month", { used: usage.used, limit: usage.limit })}`}
      </p>
    </div>
  );
}
