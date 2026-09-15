import { Compass } from "lucide-react";
import { cn } from "cn";

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[color-mix(in_oklch,var(--sidebar-primary),white_15%)] to-[color-mix(in_oklch,var(--sidebar-primary),black_25%)] text-white"
        style={{ boxShadow: "0 4px 14px -2px color-mix(in oklch, var(--sidebar-primary), transparent 35%)" }}
      >
        <Compass className="size-4.5" strokeWidth={2.25} />
      </div>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          FinPilot
        </span>
      )}
    </div>
  );
}
