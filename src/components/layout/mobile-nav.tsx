"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { t } from "@/lib/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";
import { useFinance } from "@/components/providers/finance-provider";
import { SidebarUser } from "./sidebar-user";
import { MonthSelector } from "./month-selector";

const SECTIONS: Array<"Overview" | "Planning"> = ["Overview", "Planning"];

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const isAdmin = !!useFinance().user.isAdmin;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-4">
          <SheetTitle asChild className="text-sidebar-foreground">
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="px-3 pt-4 sm:hidden [&_button]:w-full [&_button]:justify-start">
          <MonthSelector />
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section}>
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                {t(section)}
              </p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.filter((item) => item.section === section && (!item.adminOnly || isAdmin)).map((item) => {
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                        <span>{t(item.label)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <SidebarUser />
        </div>
      </SheetContent>
    </Sheet>
  );
}
