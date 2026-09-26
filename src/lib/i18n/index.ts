import { bn } from "./bn";

export type Lang = "en" | "bn";
export const LANGS: { value: Lang; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "bn", label: "বাংলা", short: "বাং" },
];
export const LANG_COOKIE = "lang";

type Vars = Record<string, string | number>;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function localDigits(s: string, lang: Lang) {
  return lang === "bn" ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s;
}

export function translate(lang: Lang, text: string, vars?: Vars) {
  let out = lang === "bn" ? bn[text] ?? text : text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      const value = typeof v === "number" ? localDigits(v.toLocaleString("en-US"), lang) : v;
      out = out.split(`{${k}}`).join(value);
    }
  }
  return out;
}

// The client renders the signed-in app only in the browser and remounts it when the
// language changes, so a module-level current language is safe for app components.
let current: Lang = "en";
export const setCurrentLang = (lang: Lang) => {
  current = lang;
};
export const getLang = () => current;
export const t = (text: string, vars?: Vars) => translate(current, text, vars);

export const isLang = (v: unknown): v is Lang => v === "en" || v === "bn";
