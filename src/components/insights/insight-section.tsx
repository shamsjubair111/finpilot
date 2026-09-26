import { CheckCircle2, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { Insight } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";

const SEVERITY_ICON: Record<Insight["severity"], LucideIcon> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  neutral: Info,
};

const SEVERITY_STYLE: Record<Insight["severity"], string> = {
  positive: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  neutral: "text-primary bg-primary/10",
};

export function InsightSection({
  title,
  icon: Icon,
  insights,
  emptyLabel,
}: {
  title: string;
  icon: LucideIcon;
  insights: Insight[];
  emptyLabel: string;
}) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <EmptyState icon={Icon} title={t("Nothing to report")} description={emptyLabel} className="py-8" />
        ) : (
          <ul className="space-y-3">
            {insights.map((insight) => {
              const SevIcon = SEVERITY_ICON[insight.severity];
              return (
                <li key={insight.id} className="flex items-start gap-3">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", SEVERITY_STYLE[insight.severity])}>
                    <SevIcon className="size-3.5" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
