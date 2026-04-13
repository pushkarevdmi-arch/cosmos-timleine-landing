"use client";

import { useMemo, useState } from "react";
import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyShort,
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
                  className="shrink-0 rounded-[2px] bg-ds-bg-brand-solid h-1 w-5"
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
                        <div className="flex w-full shrink-0 flex-row flex-wrap items-baseline gap-x-3 sm:w-[120px] sm:flex-none sm:flex-col sm:items-start sm:gap-1">
                          <div className="flex min-w-0 flex-row flex-wrap items-baseline gap-x-4 gap-y-1 sm:w-full sm:flex-col sm:items-start sm:gap-x-0 sm:gap-y-1.5 sm:text-left">
                            <p className="font-sans text-[14px] leading-[18px] font-semibold text-ds-neutral-100 sm:text-[16px] sm:leading-[20px]">
                              {formatEventDateOnlyShort(event.date)}
                            </p>
                            {eventHasSpecificUtcTime(event.date) ? (
                              <p className="font-sans text-[14px] leading-[18px] font-semibold text-ds-neutral-300 sm:font-medium sm:text-ds-neutral-400">
                                {formatEventTimeUtcLabel(event.date)}
                              </p>
                            ) : null}
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

