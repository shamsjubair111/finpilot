import type { ComponentType } from "react";
import * as icons from "lucide-react";
import { HelpCircle } from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconName = keyof typeof icons;

// Icons are stored in the database as lucide names; this maps a name to its component.
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (icons[name as IconName] as ComponentType<LucideProps>) ?? HelpCircle;
  return <Icon {...props} />;
}
