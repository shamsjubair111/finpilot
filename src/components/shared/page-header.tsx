import type { ReactNode } from "react";
import { cn } from "cn";
import { EditOnly } from "./edit-only";

export function PageHeader({
  title,
  subtitle,
  actions,
  editOnly = false,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Actions change data, so hide them from view-only household members. */
  editOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{editOnly ? <EditOnly>{actions}</EditOnly> : actions}</div>}
    </div>
  );
}
