import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { FinancialHealth } from "@/types/finance";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { GLOSSARY } from "@/lib/glossary";
import { cn } from "cn";

const STATUS_STYLES: Record<FinancialHealth["status"], { ring: string; text: string; bg: string }> = {
  Excellent: { ring: "var(--success)", text: "text-success", bg: "bg-success/10" },
  Healthy: { ring: "var(--primary)", text: "text-primary", bg: "bg-primary/10" },
  Fair: { ring: "var(--warning)", text: "text-warning", bg: "bg-warning/10" },
  "At Risk": { ring: "var(--destructive)", text: "text-destructive", bg: "bg-destructive/10" },
};

export function FinancialHealthCard({ health }: { health: FinancialHealth }) {
  const style = STATUS_STYLES[health.status];
  const circumference = 2 * Math.PI * 42;
  const dash = (health.score / 100) * circumference;

  return (
    <Card className="animate-in-up h-full gap-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          Financial Health
          <InfoTooltip text={GLOSSARY.financialHealth} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative flex size-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={style.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">{health.score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", style.bg, style.text)}>
              {health.status}
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Based on savings rate, emergency fund, budget discipline, debt, and goal progress.
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          {health.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {insight.toLowerCase().includes("close") || insight.toLowerCase().includes("could") ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              ) : insight.toLowerCase().includes("strong") || insight.toLowerCase().includes("well") ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">{insight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
