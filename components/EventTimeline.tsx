"use client";

import type { HeroEventData } from "./HeroEvent";

type EventTimelineProps = {
  events: HeroEventData[];
  onOpen: (event: HeroEventData) => void;
};

export default function EventTimeline({
  events,
  onOpen,
}: EventTimelineProps) {
  if (!events.length) {
    return (
      <p className="type-body-tight text-ds-neutral-500">
        No events yet. Add future cosmic milestones to see them unfold along a
        timeline.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* vertical spine */}
      <div className="pointer-events-none absolute left-4 top-0 h-full w-px bg-ds-neutral-700/70 sm:left-6" />

      <ol className="space-y-4 pl-10 sm:pl-14">
        {events.map((event, index) => {
          const currentSection = getTimeRangeSection(event);
          const previousSection =
            index > 0 ? getTimeRangeSection(events[index - 1]) : null;
          const showSectionHeader = currentSection !== previousSection;

          return (
            <li key={event.id}>
              {showSectionHeader ? (
                <div className="mb-3 mt-2 flex items-center gap-3">
                  <span className="type-era-label text-ds-neutral-400">
                    {currentSection}
                  </span>
                  <span className="h-px flex-1 bg-ds-neutral-800/80" />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => onOpen(event)}
                className="group flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-ds-neutral-800/80 bg-ds-neutral-950/70 p-6 text-left transition hover:border-ds-primary-400/70"
              >
                {/* Node */}
                <div className="relative mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                  <div className="absolute h-3 w-3 rounded-full bg-ds-neutral-900 ring-2 ring-ds-neutral-700/80" />
                  <div className="relative h-2 w-2 rounded-full bg-ds-neutral-500 group-hover:bg-ds-primary-300" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex flex-1 flex-col gap-2">
                  <p className="type-era-label text-ds-neutral-500">
                    {formatEraLabel(event.date)}
                  </p>
                  <h3 className="font-sans text-h4-600 text-ds-neutral-50">
                    {event.title}
                  </h3>
                  <p className="line-clamp-2 font-sans text-body-medium-400 text-ds-neutral-400">
                    {event.description}
                  </p>
                </div>

                <div className="ml-2 flex flex-col items-end gap-1 text-right">
                  <p className="type-era-label text-ds-neutral-500">
                    Date
                  </p>
                  <p className="font-sans text-[length:var(--ds-typography-size-body-s)] leading-[18px] font-semibold text-ds-neutral-100">
                    {formatShortDate(event.date)}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
  }).format(date);
}

function formatEraLabel(dateStr: string) {
  const year = new Date(dateStr).getUTCFullYear();
  if (!Number.isFinite(year)) return "Far future";

  if (year < 2100) return "Near future";
  if (year < 1000000) return "Deep time";
  if (year < 1000000000) return "Galactic era";
  return "Cosmic era";
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

