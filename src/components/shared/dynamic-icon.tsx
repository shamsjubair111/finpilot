import type { ComponentType } from "react";
import * as icons from "lucide-react";
import { HelpCircle } from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconName = keyof typeof icons;

/**
 * Resolves a lucide icon by its string name. Mock data stores icons as
 * strings (e.g. "Home", "Laptop") so they stay plain, serializable data —
 * this component is the single place that maps a name to a component.
 */
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (icons[name as IconName] as ComponentType<LucideProps>) ?? HelpCircle;
  return <Icon {...props} />;
}
