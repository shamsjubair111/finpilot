"use client";

import * as React from "react";
import { cn } from "cn";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import { VerifyEmailBanner } from "./verify-email-banner";
import { SyncBanner } from "./sync-banner";
import { HouseholdBanner } from "./household-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="bg-aurora min-h-dvh print:bg-none print:bg-white">
      <div className="print:hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      </div>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[margin] duration-200 ease-out",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64",
          "print:ml-0"
        )}
      >
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0">
          <div className="mx-auto w-full min-w-0 max-w-[1400px]">
            <div className="print:hidden">
              <VerifyEmailBanner />
              <SyncBanner />
              <HouseholdBanner />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
