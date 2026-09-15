"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "cn";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SECTIONS: Array<"Overview" | "Planning"> = ["Overview", "Planning"];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center px-4", collapsed && "justify-center px-0")}>
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 no-scrollbar">
        {SECTIONS.map((section) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                {section}
              </p>
            )}
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.section === section).map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-0 py-2.5",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--sidebar-primary),transparent_75%)]"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-1 left-1 w-[3px] rounded-full bg-sidebar-primary"
                        style={{ boxShadow: "0 0 12px color-mix(in oklch, var(--sidebar-primary), transparent 30%)" }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        isActive && "text-sidebar-primary"
                      )}
                      strokeWidth={2}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
