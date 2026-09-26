"use client";

import * as React from "react";
import { LANG_COOKIE, setCurrentLang, translate, type Lang } from "./index";
import { setCurrencyPref } from "@/lib/currency";
import type { Currency } from "@/types/finance";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nValue | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(initialLang);
  setCurrentLang(lang);

  const setLang = React.useCallback((next: Lang) => {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    setCurrentLang(next);
    setLangState(next);
  }, []);

  const value = React.useMemo<I18nValue>(
    () => ({ lang, setLang, t: (text, vars) => translate(lang, text, vars) }),
    [lang, setLang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useSyncCurrency(currency: Currency) {
  setCurrencyPref(currency);
}
