"use client";

import { useMemo, useState } from "react";
import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
  getEventCalendarYear,
} from "@/utils/eventDate";
import type { HeroEventData } from "./HeroEvent";

type EventTimelineProps = {
  events: HeroEventData[];
  onOpen: (event: HeroEventData) => void;
};

export default function EventTimeline({
  events,
  onOpen,
}: EventTimelineProps) {
  const sections = useMemo(() => {
    const groupedSections: Array<{
      title: string;
      events: HeroEventData[];
    }> = [];

    events.forEach((event) => {
      const sectionTitle = getTimeRangeSection(event);
      const lastSection = groupedSections[groupedSections.length - 1];

      if (lastSection?.title === sectionTitle) {
        lastSection.events.push(event);
        return;
      }

      groupedSections.push({
        title: sectionTitle,
        events: [event],
      });
    });

    return groupedSections;
  }, [events]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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
      <ol className="space-y-4 pl-0 sm:pl-0">
        {sections.map((section, sectionIndex) => {
          const sectionKey = `${section.title}-${sectionIndex}`;
          const isCollapsed = collapsedSections[sectionKey] ?? false;
          return (
            <li key={sectionKey} className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setCollapsedSections((current) => ({
                    ...current,
                    [sectionKey]: !isCollapsed,
                  }))
                }
                className="group mt-12 mr-4 flex w-full cursor-pointer items-center gap-3 py-2 text-left"
                aria-expanded={!isCollapsed}
              >
                <span
                  className="shrink-0 rounded-none bg-ds-bg-brand-solid h-1 w-7"
                  aria-hidden
                />
                <span className="type-era-label text-ds-neutral-00">
                  {section.title}
                </span>
                <span className="h-px flex-1 bg-ds-neutral-800/80" />
                <span className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ds-neutral-900 transition-colors duration-200">
                  <img
                    src={isCollapsed ? "/icons/arrow-down.svg" : "/icons/arrow-up.svg"}
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />
                </span>
              </button>

              {isCollapsed ? null : (
                <ol className="space-y-4">
                  {section.events.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(event)}
                        className="group flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-ds-neutral-800 bg-[var(--app-surface-elevated)] px-8 py-8 text-left transition hover:border-ds-primary-400/70 sm:flex-row sm:items-start sm:gap-2"
                      >
                        <div className="flex w-full shrink-0 justify-start sm:w-[120px] sm:flex-none sm:self-start">
                          <div className="flex h-10 w-fit max-w-full min-w-0 justify-start sm:hidden">
                            <div
                              className="hero-event__date-badge inline-flex h-10 max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-[12px] border-0 bg-ds-neutral-850 py-1 pl-3 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50"
                              role="group"
                              aria-label={`Event date${eventHasSpecificUtcTime(event.date) ? " and time" : ""}`}
                            >
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                                <img
                                  src="/icons/calendar.svg"
                                  width={22}
                                  height={22}
                                  alt=""
                                  aria-hidden
                                  className="h-full w-full object-contain"
                                />
                              </span>
                              <span className="min-w-0 truncate font-sans">
                                {formatEventDateOnlyLong(event.date)}
                              </span>
                              {eventHasSpecificUtcTime(event.date) ? (
                                <>
                                  <span
                                    className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500"
                                    aria-hidden="true"
                                  />
                                  <span className="shrink-0 whitespace-nowrap font-sans">
                                    {formatEventTimeUtcLabel(event.date)}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className="hidden min-w-0 w-full text-left sm:block"
                            role="group"
                            aria-label={`Event date${eventHasSpecificUtcTime(event.date) ? " and time" : ""}`}
                          >
                            <div className="flex flex-col items-start gap-1 font-sans text-[14px] font-normal leading-tight text-ds-neutral-50 sm:text-[16px] sm:leading-snug">
                              <span className="break-words">
                                {formatEventDateOnlyLong(event.date)}
                              </span>
                              {eventHasSpecificUtcTime(event.date) ? (
                                <span className="break-words text-ds-neutral-400">
                                  {formatEventTimeUtcLabel(event.date)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <span
                          aria-hidden
                          className="hidden h-11 w-0 shrink-0 self-center border-l border-ds-neutral-600 sm:inline-block"
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:pl-4">
                          <h3 className="font-sans text-[20px] leading-[24px] font-semibold text-ds-neutral-50">
                            {event.title}
                          </h3>
                          <p className="line-clamp-2 font-sans text-body-medium-400 text-ds-neutral-400">
                            {event.shortDescription}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getTimeRangeSection(event: HeroEventData) {
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

