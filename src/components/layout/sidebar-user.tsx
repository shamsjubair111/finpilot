"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFinance } from "@/components/providers/finance-provider";
import { cn } from "cn";
import { t } from "@/lib/i18n";

export function SidebarUser({ collapsed = false }: { collapsed?: boolean }) {
  const { user, signOut } = useFinance();
  return (
    <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2", collapsed && "justify-center bg-transparent p-0")}>
      <Avatar className="size-8 shrink-0">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
        <AvatarFallback className="bg-gradient-brand text-xs font-semibold text-white">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label={t("Sign out")}
            className="rounded-lg p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
