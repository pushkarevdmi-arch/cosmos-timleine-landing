import type { HeroEventData } from "@/components/HeroEvent";
import { getEventCalendarYear } from "@/utils/eventDate";

/** Time-era label for grid grouping / filters (matches `data/events` categories). */
export function getTimeRangeSection(event: HeroEventData): string {
  if (event.timeCategory) return event.timeCategory;

  const eventYear = getEventCalendarYear(event.date);
  if (!Number.isFinite(eventYear)) return "Next 100 Years";

  const currentYear = new Date().getUTCFullYear();
  const yearsAhead = Math.max(0, eventYear - currentYear);

  if (yearsAhead <= 100) return "Next 100 Years";
  if (yearsAhead <= 10000) return "Next 10,000 Years";
  if (yearsAhead <= 1000000000) return "Millions of Years";
  return "Billions of Years";
}

export function groupEventsByTimeSection(
  events: HeroEventData[]
): { section: string; events: HeroEventData[] }[] {
  const groups: { section: string; events: HeroEventData[] }[] = [];
  for (const event of events) {
    const section = getTimeRangeSection(event);
    const last = groups[groups.length - 1];
    if (last && last.section === section) {
      last.events.push(event);
    } else {
      groups.push({ section, events: [event] });
    }
  }
  return groups;
}
