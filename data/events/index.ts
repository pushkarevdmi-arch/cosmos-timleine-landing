import type { Locale } from "@/lib/i18n";
import billionsOfYears from "./billions-of-years.json";
import billionsOfYearsRu from "./billions-of-years-ru.json";
import millionsOfYears from "./millions-of-years.json";
import millionsOfYearsRu from "./millions-of-years-ru.json";
import next10000Years from "./next-10000-years.json";
import next10000YearsRu from "./next-10000-years-ru.json";
import next100Years from "./next-100-years.json";
import next100YearsRu from "./next-100-years-ru.json";

type EventRecord = {
  timeCategory?: string;
  [key: string]: unknown;
};

/** Canonical English keys used for filters and section logic. */
const TIME_CATEGORY_CANONICAL: Record<string, string> = {
  "Next 100 Years": "Next 100 Years",
  "Следующие 100 лет": "Next 100 Years",
  "Next 10,000 Years": "Next 10,000 Years",
  "Следующие 10 000 лет": "Next 10,000 Years",
  "Millions of Years": "Millions of Years",
  "Миллионы лет": "Millions of Years",
  "Billions of Years": "Billions of Years",
  "Миллиарды лет": "Billions of Years",
};

function normalizeTimeCategory<T extends EventRecord>(event: T): T {
  if (!event.timeCategory) return event;
  const canonical = TIME_CATEGORY_CANONICAL[event.timeCategory];
  if (!canonical || canonical === event.timeCategory) return event;
  return { ...event, timeCategory: canonical };
}

function mergeForLocale(locale: Locale): EventRecord[] {
  const next100 = locale === "ru" ? next100YearsRu : next100Years;
  const next10000 = locale === "ru" ? next10000YearsRu : next10000Years;
  const millions = locale === "ru" ? millionsOfYearsRu : millionsOfYears;
  const billions = locale === "ru" ? billionsOfYearsRu : billionsOfYears;

  return [
    ...next100,
    ...next10000,
    ...millions,
    ...billions,
  ].map(normalizeTimeCategory);
}

/** Merged dataset: Next 100 Years → 10,000 → Millions → Billions (same order as filters). */
const allEvents = mergeForLocale("en");

export function getEventsForLocale(locale: Locale) {
  return mergeForLocale(locale);
}

export default allEvents;
