"use client";

import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";

type EventGridProps = {
  events: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
};

export default function EventGrid({ events, onExplore }: EventGridProps) {
  if (!events.length) {
    return (
      <p className="type-body-tight text-ds-neutral-500">
        No other events are currently in view. Add more to extend your cosmic
        journey.
      </p>
    );
  }

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2">
      {events.map((event, index) => {
        const currentSection = getTimeRangeSection(event);
        const previousSection =
          index > 0 ? getTimeRangeSection(events[index - 1]) : null;
        const showSectionHeader = currentSection !== previousSection;

        return (
          <div key={event.id} className="contents">
            {showSectionHeader ? (
              <div className="col-span-full mt-2 mb-1">
                <div className="flex items-center gap-3">
                  <span className="type-era-label text-ds-neutral-00">
                    {currentSection}
                  </span>
                  <span className="h-px flex-1 bg-ds-neutral-800/80" />
                </div>
              </div>
            ) : null}

            <div
              className="h-full"
              onClick={(e) => {
                if (!onExplore) return;
                const target = e.target as HTMLElement | null;
                if (!target || !target.closest) return;

                const button = target.closest("button");
                if (!button) return;

                const hasExploreIcon = button.querySelector(
                  ".event-card__explore-icon"
                );
                if (hasExploreIcon) {
                  onExplore(event);
                }
              }}
            >
              <EventCard event={event} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getTimeRangeSection(event: HeroEventData) {
  if (event.timeSection) return event.timeSection;

  const eventYear = new Date(event.date).getUTCFullYear();
  if (!Number.isFinite(eventYear)) return "Next 100 Years";

  const currentYear = new Date().getUTCFullYear();
  const yearsAhead = Math.max(0, eventYear - currentYear);

  if (yearsAhead <= 100) return "Next 100 Years";
  if (yearsAhead <= 10000) return "Next 10,000 Years";
  if (yearsAhead <= 1000000000) return "Millions of Years";
  return "Billions of Years";
}
