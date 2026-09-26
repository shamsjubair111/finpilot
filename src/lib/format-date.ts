import { format as fnsFormat } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import { getLang, localDigits } from "@/lib/i18n";

export function formatDate(date: Date | string | number, pattern: string) {
  const lang = getLang();
  return localDigits(fnsFormat(new Date(date), pattern, { locale: lang === "bn" ? bn : enUS }), lang);
}
