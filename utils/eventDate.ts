/** Event `date` strings are treated as UTC calendar + optional time of day. */

export function eventHasSpecificUtcTime(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0
  );
}

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

export function formatEventDateOnlyLong(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en", longDateUtc).format(date);
}

export function formatEventDateOnlyShort(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", shortDateUtc).format(date);
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
