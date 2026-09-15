"use client";

import * as React from "react";
import { cn } from "cn";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[margin] duration-200 ease-out",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64"
        )}
      >
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
