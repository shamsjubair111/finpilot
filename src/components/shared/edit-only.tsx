"use client";

import type { ReactNode } from "react";
import { useFinance } from "@/components/providers/finance-provider";

/** Renders its children only for people allowed to change the current household's data. */
export function EditOnly({ children }: { children: ReactNode }) {
  return useFinance().readOnly ? null : <>{children}</>;
}
