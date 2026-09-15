"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-items";
import { MonthSelector } from "./month-selector";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { QuickAdd } from "./quick-add";

function useCurrentPageTitle() {
  const pathname = usePathname();
  const match = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return match?.label ?? "FinPilot";
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const title = useCurrentPageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-background/80 px-4 backdrop-blur-md [box-shadow:0_1px_0_color-mix(in_oklch,var(--foreground),transparent_93%)] supports-backdrop-filter:bg-background/65 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight sm:flex-initial sm:text-base">
        {title}
      </h1>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden sm:block">
          <MonthSelector />
        </div>
        <NotificationsMenu />
        <QuickAdd />
        <UserMenu />
      </div>
    </header>
  );
}
