import en from "@/messages/en.json";
import ru from "@/messages/ru.json";

export type Locale = "en" | "ru";

export const LOCALES: Locale[] = ["en", "ru"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "cosmorrow-locale";

const messages = { en, ru } as const;

export type Messages = (typeof messages)[Locale];

function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = messages[locale] as Record<string, unknown>;
  const fallback = messages.en as Record<string, unknown>;
  let text = resolvePath(dict, key) ?? resolvePath(fallback, key) ?? key;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}

export function intlLocaleFor(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

export function timeRangeLabel(locale: Locale, range: string): string {
  const dict = messages[locale].timeRange as Record<string, string>;
  const fallback = messages.en.timeRange as Record<string, string>;
  return dict[range] ?? fallback[range] ?? range;
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "ru" ? stored : null;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("ru") ? "ru" : DEFAULT_LOCALE;
}
