import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  ListChecks,
  FlaskConical,
  GanttChartSquare,
  Lightbulb,
  FileBarChart,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: "Overview" | "Planning";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, section: "Overview" },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, section: "Overview" },
  { label: "Budget", href: "/budget", icon: Wallet, section: "Overview" },
  { label: "Goals", href: "/goals", icon: Target, section: "Planning" },
  { label: "Wishlist", href: "/wishlist", icon: ListChecks, section: "Planning" },
  { label: "Scenario Lab", href: "/scenario-lab", icon: FlaskConical, section: "Planning" },
  { label: "Timeline", href: "/timeline", icon: GanttChartSquare, section: "Planning" },
  { label: "Insights", href: "/insights", icon: Lightbulb, section: "Planning" },
  { label: "Reports", href: "/reports", icon: FileBarChart, section: "Planning" },
  { label: "Settings", href: "/settings", icon: Settings, section: "Planning" },
];
