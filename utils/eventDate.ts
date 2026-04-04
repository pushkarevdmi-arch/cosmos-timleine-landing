/**
 * Event `date` strings:
 * - Full calendar: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ` (year may exceed 9999).
 * - **Year-only** (unknown month/day): a string of digits only, e.g. `2000000000` — do not use Jan 1 as a fake.
 */

const ISO_YMD = /^(\d{1,})-(\d{2})-(\d{2})/;
const YEAR_ONLY = /^(\d+)$/;

/** Calendar years above this are not representable with `Date.UTC` in typical JS engines. */
export const MAX_UTC_CALENDAR_YEAR = 275760;

export type ParsedYmd = {
  /** Raw year digits (no sign), for compare + display beyond `Number` precision. */
  yStr: string;
  /** Best-effort numeric year; may be `NaN` if the value is too large for IEEE doubles. */
  y: number;
  /** `null` when the source was year-only (no month/day). */
  m: number | null;
  d: number | null;
};

function effectiveMonthDay1(parts: ParsedYmd): { m: number; d: number } {
  if (parts.m !== null && parts.d !== null) return { m: parts.m, d: parts.d };
  return { m: 1, d: 1 };
}

/** Compare two positive integer digit strings (no scientific notation). */
function compareDecimalYearStrings(a: string, b: string): number {
  const na = a.replace(/^0+/, "") || "0";
  const nb = b.replace(/^0+/, "") || "0";
  if (na.length !== nb.length) return na.length < nb.length ? -1 : 1;
  return na < nb ? -1 : na > nb ? 1 : 0;
}

function formatYearDigitsWithGrouping(yStr: string): string {
  const n = yStr.replace(/^0+/, "") || "0";
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Year label for hero slider / headings (supports years beyond `Number.MAX_SAFE_INTEGER`). */
export function formatEventCalendarYearLabel(dateStr: string): string {
  const instant = getEventInstantMs(dateStr);
  if (instant !== null) {
    return new Date(instant).getUTCFullYear().toLocaleString("en-US");
  }
  const parts = parseEventYmd(dateStr);
  if (!parts) return "Unknown";
  return formatYearDigitsWithGrouping(parts.yStr);
}

const HERO_YEAR_GROUPED_MAX_CHARS = 20;

/**
 * Hero timeline only: avoids huge comma-grouped year strings (e.g. heat-death scales).
 * When the grouped year would be too long, returns a fixed human label.
 */
export function formatHeroTimelineYearLabel(dateStr: string): string {
  const instant = getEventInstantMs(dateStr);
  if (instant !== null) {
    return new Date(instant).getUTCFullYear().toLocaleString("en-US");
  }
  const parts = parseEventYmd(dateStr);
  if (!parts) return "—";
  const grouped = formatYearDigitsWithGrouping(parts.yStr);
  if (grouped.length <= HERO_YEAR_GROUPED_MAX_CHARS) {
    return grouped;
  }
  return "End of time";
}

export function parseEventYmd(dateStr: string): ParsedYmd | null {
  const trimmed = dateStr.trim();
  const m = trimmed.match(ISO_YMD);
  if (m) {
    const yStr = m[1];
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (![mo, d].every((n) => Number.isFinite(n))) return null;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const y = Number(yStr);
    return { yStr, y, m: mo, d };
  }
  const yOnly = trimmed.match(YEAR_ONLY);
  if (!yOnly) return null;
  const yStr = yOnly[1];
  if (!/^\d+$/.test(yStr)) return null;
  const y = Number(yStr);
  return { yStr, y, m: null, d: null };
}

function utcMsFromYmd(y: number, m: number, d: number): number | null {
  const ms = Date.UTC(y, m - 1, d);
  return Number.isNaN(ms) ? null : ms;
}

/** Milliseconds since Unix epoch for the event’s calendar instant (UTC), or `null` if out of `Date` range. */
export function getEventInstantMs(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  const parts = parseEventYmd(dateStr);
  if (!parts) return null;
  if (!/^\d+$/.test(parts.yStr)) return null;
  if (parts.yStr.length > 6) return null;
  const yNum = Number(parts.yStr);
  if (
    !Number.isFinite(yNum) ||
    yNum < 1 ||
    yNum > MAX_UTC_CALENDAR_YEAR
  ) {
    return null;
  }
  const md = effectiveMonthDay1(parts);
  return utcMsFromYmd(yNum, md.m, md.d);
}

export function getTodayUtcYmd(): string {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
}

/** True if the event date is today or in the future (UTC calendar compare when `Date` cannot represent the year). */
export function isEventOnOrAfterNow(dateStr: string, nowMs = Date.now()): boolean {
  const instant = getEventInstantMs(dateStr);
  if (instant !== null) return instant >= nowMs;
  const parts = parseEventYmd(dateStr);
  if (parts) return compareEventDateStrings(dateStr, getTodayUtcYmd()) >= 0;
  return false;
}

/** Lexicographic compare on Y-M-D; works for arbitrary year magnitude. */
export function compareEventDateStrings(a: string, b: string): number {
  const pa = parseEventYmd(a);
  const pb = parseEventYmd(b);
  if (pa && pb) {
    const yc = compareDecimalYearStrings(pa.yStr, pb.yStr);
    if (yc !== 0) return yc;
    const ea = effectiveMonthDay1(pa);
    const eb = effectiveMonthDay1(pb);
    if (ea.m !== eb.m) return ea.m < eb.m ? -1 : ea.m > eb.m ? 1 : 0;
    if (ea.d !== eb.d) return ea.d < eb.d ? -1 : ea.d > eb.d ? 1 : 0;
    return 0;
  }
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta < tb ? -1 : ta > tb ? 1 : 0;
  if (pa && !pb) return 1;
  if (!pa && pb) return -1;
  return 0;
}

export function getEventCalendarYear(dateStr: string): number {
  const instant = getEventInstantMs(dateStr);
  if (instant !== null) return new Date(instant).getUTCFullYear();
  const parts = parseEventYmd(dateStr);
  if (!parts) return NaN;
  if (Number.isFinite(parts.y) && parts.y <= Number.MAX_SAFE_INTEGER) {
    return parts.y;
  }
  return Number.POSITIVE_INFINITY;
}

function yearsBetweenCalendarYStr(targetYStr: string, nowY: number): number {
  try {
    const a = BigInt(targetYStr);
    const b = BigInt(nowY);
    const diff = a - b;
    if (diff <= BigInt(0)) return 0;
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    if (diff > max) return Number.MAX_SAFE_INTEGER;
    return Number(diff);
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export type CountdownBreakdown = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Countdown parts for UI. Uses `Date` math when representable; otherwise calendar-year difference
 * (for years beyond ~275760 CE where `Date.UTC` is not available).
 */
export function getCountdownBreakdown(dateStr: string, nowMs = Date.now()): CountdownBreakdown {
  const parts = parseEventYmd(dateStr);
  const instant = getEventInstantMs(dateStr);

  if (parts && instant === null) {
    if (compareEventDateStrings(dateStr, getTodayUtcYmd()) < 0) {
      return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }
    const nowY = new Date(nowMs).getUTCFullYear();
    return {
      years: yearsBetweenCalendarYStr(parts.yStr, nowY),
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false,
    };
  }

  if (instant === null) {
    return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const diff = instant - nowMs;
  if (diff <= 0) {
    return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const totalDays = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const years = Math.floor(totalDays / 365);
  const days = totalDays - years * 365;

  return { years, days, hours, minutes, seconds, isPast: false };
}

/** Approximate whole calendar years until event (hero long-range pill). */
export function getApproxYearsRemaining(dateStr: string, nowMs = Date.now()): number {
  const parts = parseEventYmd(dateStr);
  const instant = getEventInstantMs(dateStr);
  if (instant !== null && !Number.isNaN(instant)) {
    if (instant <= nowMs) return 0;
    const yearMs = DAY_MS * 365;
    return Math.floor((instant - nowMs) / yearMs);
  }
  if (parts) {
    const nowY = new Date(nowMs).getUTCFullYear();
    return yearsBetweenCalendarYStr(parts.yStr, nowY);
  }
  return 0;
}

/** Millions / Billions cards & hero: number + Million | Billion | Trillion (title case). */
export function formatMegaYearScaleParts(years: number): {
  numberPart: string;
  scaleWord: string | null;
} {
  const y = Math.max(0, Math.floor(years));
  if (y >= 1_000_000_000_000) {
    return {
      numberPart: Math.round(y / 1_000_000_000_000).toLocaleString("en-US"),
      scaleWord: "Trillion",
    };
  }
  if (y >= 1_000_000_000) {
    return {
      numberPart: Math.round(y / 1_000_000_000).toLocaleString("en-US"),
      scaleWord: "Billion",
    };
  }
  if (y >= 1_000_000) {
    return {
      numberPart: Math.round(y / 1_000_000).toLocaleString("en-US"),
      scaleWord: "Million",
    };
  }
  return { numberPart: y.toLocaleString("en-US"), scaleWord: null };
}

/**
 * When the event is at least ~1M years in the future, prefer this over a fake calendar day.
 * Uses short "mil" / "bil" labels (million / billion years ahead).
 */
export function formatYearsAheadColloquial(wholeYears: number): string {
  const y = Math.max(0, Math.floor(Number(wholeYears)));
  if (y >= 1_000_000_000_000) {
    const v = Math.round(y / 1_000_000_000_000);
    return `~${v.toLocaleString("en-US")} tril years ahead`;
  }
  if (y >= 1_000_000_000) {
    const v = Math.round(y / 1_000_000_000);
    return `~${v.toLocaleString("en-US")} bil years ahead`;
  }
  if (y >= 1_000_000) {
    const v = Math.round(y / 1_000_000);
    return `~${v.toLocaleString("en-US")} mil years ahead`;
  }
  return `~${y.toLocaleString("en-US")} years ahead`;
}

const MONTH_LONG_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const longDateUtc: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "2-digit",
  timeZone: "UTC",
};

const shortDateUtc: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

const timeUtc: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
};

export function eventHasSpecificUtcTime(dateStr: string): boolean {
  if (!dateStr.includes("T")) return false;
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    return (
      d.getUTCHours() !== 0 ||
      d.getUTCMinutes() !== 0 ||
      d.getUTCSeconds() !== 0 ||
      d.getUTCMilliseconds() !== 0
    );
  }
  const timeMatch = dateStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (!timeMatch) return false;
  return timeMatch[1] !== "00" || timeMatch[2] !== "00" || timeMatch[3] !== "00";
}

export function formatEventDateOnlyLong(dateStr: string, nowMs = Date.now()): string {
  const parts = parseEventYmd(dateStr);
  if (!parts) return "Unknown date";

  const approx = getApproxYearsRemaining(dateStr, nowMs);
  const breakdown = getCountdownBreakdown(dateStr, nowMs);
  if (!breakdown.isPast && approx >= 1_000_000) {
    return formatYearsAheadColloquial(approx);
  }

  // Year-only in source (`"2134"`): never show a fake Jan 1 from internal Date.UTC anchoring.
  if (parts.m === null) {
    return formatYearDigitsWithGrouping(parts.yStr);
  }

  const instant = getEventInstantMs(dateStr);
  if (instant !== null) {
    return new Intl.DateTimeFormat("en", longDateUtc).format(new Date(instant));
  }

  const monthName = MONTH_LONG_EN[parts.m - 1] ?? "Month";
  const yearLabel = formatYearDigitsWithGrouping(parts.yStr);
  return `${monthName} ${String(parts.d).padStart(2, "0")}, ${yearLabel}`;
}

export function formatEventDateOnlyShort(dateStr: string, nowMs = Date.now()): string {
  const parts = parseEventYmd(dateStr);
  if (!parts) return "Unknown";

  const approx = getApproxYearsRemaining(dateStr, nowMs);
  const breakdown = getCountdownBreakdown(dateStr, nowMs);
  if (!breakdown.isPast && approx >= 1_000_000) {
    return formatYearsAheadColloquial(approx);
  }

  if (parts.m === null) {
    return formatYearDigitsWithGrouping(parts.yStr);
  }

  const instant = getEventInstantMs(dateStr);
  if (instant !== null) {
    return new Intl.DateTimeFormat("en", shortDateUtc).format(new Date(instant));
  }

  const monthShort = MONTH_LONG_EN[parts.m - 1]?.slice(0, 3) ?? "?";
  const yearLabel = formatYearDigitsWithGrouping(parts.yStr);
  return `${monthShort} ${parts.d}, ${yearLabel}`;
}

export function formatEventTimeUtcLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", timeUtc).format(date);
}

/** Single-digit days get one leading zero (e.g. 07); two or more digits as-is (47, 365). */
export function formatCountdownDaysDisplay(days: number): string {
  const n = Math.max(0, Math.floor(Number(days)));
  if (n < 10) return n.toString().padStart(2, "0");
  return n.toString();
}
