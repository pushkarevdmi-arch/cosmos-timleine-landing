"use client";

import type { HeroEventData } from "./HeroEvent";

type EventTimelineProps = {
  events: HeroEventData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function EventTimeline({
  events,
  selectedId,
  onSelect,
}: EventTimelineProps) {
  if (!events.length) {
    return (
      <p className="text-sm text-zinc-500">
        No events yet. Add future cosmic milestones to see them unfold along a
        timeline.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* vertical spine */}
      <div className="pointer-events-none absolute left-4 top-0 h-full w-px bg-zinc-700/70 sm:left-6" />

      <ol className="space-y-4 pl-10 sm:pl-14">
        {events.map((event, index) => {
          const isSelected = event.id === selectedId;

          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelect(event.id)}
                className={[
                  "group flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-zinc-950/70 p-3 text-left transition",
                  isSelected
                    ? "border-sky-500/80"
                    : "border-zinc-800/80 hover:border-sky-400/70",
                ].join(" ")}
              >
                {/* Node */}
                <div className="relative mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                  <div className="absolute h-3 w-3 rounded-full bg-zinc-900 ring-2 ring-zinc-700/80" />
                  <div
                    className={[
                      "relative h-2 w-2 rounded-full",
                      isSelected
                        ? "bg-sky-400"
                        : "bg-zinc-500 group-hover:bg-sky-300",
                    ].join(" ")}
                  />
                  <span className="absolute -left-9 hidden text-[0.6rem] font-mono text-zinc-500 sm:inline">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-zinc-500">
                    {formatEraLabel(event.date)}
                  </p>
                  <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">
                    {event.title}
                  </h3>
                  <p className="line-clamp-2 text-xs text-zinc-400 sm:text-[0.78rem]">
                    {event.description}
                  </p>
                </div>

                <div className="ml-2 flex flex-col items-end gap-1 text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-zinc-500">
                    Date
                  </p>
                  <p className="text-xs font-medium text-zinc-100">
                    {formatShortDate(event.date)}
                  </p>
                  {isSelected && (
                    <p className="mt-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-sky-300">
                      Selected
                    </p>
                  )}
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

