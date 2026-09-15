"use client";

import * as React from "react";
import { Bell, ShieldAlert, TrendingUp, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NOTIFICATIONS = [
  {
    id: 1,
    icon: ShieldAlert,
    tone: "text-warning",
    title: "Shopping budget at 93%",
    detail: "You're close to your ৳4,500 monthly limit.",
  },
  {
    id: 2,
    icon: TrendingUp,
    tone: "text-success",
    title: "Savings rate up to 47%",
    detail: "Up from 41% last month — great progress.",
  },
  {
    id: 3,
    icon: PiggyBank,
    tone: "text-primary",
    title: "Emergency fund milestone",
    detail: "You're 53% of the way to your ৳180,000 target.",
  },
];

export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2 rounded-full bg-destructive" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-1 p-1">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted">
              <n.icon className={`mt-0.5 size-4 shrink-0 ${n.tone}`} />
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
