"use client";

import { useMemo, useState } from "react";
import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyShort,
  formatEventTimeUtcLabel,
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
        {sections.map((section) => {
          const isCollapsed = collapsedSections[section.title] ?? false;
          return (
            <li key={section.title} className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setCollapsedSections((current) => ({
                    ...current,
                    [section.title]: !isCollapsed,
                  }))
                }
                className="group mt-2 mr-4 flex w-full cursor-pointer items-center gap-4 py-2 text-left"
                aria-expanded={!isCollapsed}
              >
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
                        className="group flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-ds-neutral-800/80 bg-[var(--app-surface-elevated)] px-8 py-8 text-left transition hover:border-ds-primary-400/70"
                      >
                        {/* Content */}
                        <div className="min-w-0 flex flex-1 flex-col gap-1.5">
                          <h3 className="font-sans text-[20px] leading-[24px] font-semibold text-ds-neutral-50">
                            {event.title}
                          </h3>
                          <p className="line-clamp-2 font-sans text-body-medium-400 text-ds-neutral-400">
                            {event.shortDescription}
                          </p>
                        </div>

                        <div className="ml-2 flex flex-col items-end gap-1 text-right">
                          <p className="type-era-label text-ds-neutral-500">
                            Date
                          </p>
                          <div className="flex flex-col items-end gap-1.5">
                            <p className="font-sans text-[18px] leading-[20px] font-semibold text-ds-neutral-100">
                              {formatEventDateOnlyShort(event.date)}
                            </p>
                            {eventHasSpecificUtcTime(event.date) ? (
                              <p className="font-sans text-[14px] leading-[18px] font-medium text-ds-neutral-400">
                                {formatEventTimeUtcLabel(event.date)}
                              </p>
                            ) : null}
                          </div>
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

  const eventYear = new Date(event.date).getUTCFullYear();
  if (!Number.isFinite(eventYear)) return "Next 100 Years";

  const currentYear = new Date().getUTCFullYear();
  const yearsAhead = Math.max(0, eventYear - currentYear);

  if (yearsAhead <= 100) return "Next 100 Years";
  if (yearsAhead <= 10000) return "Next 10,000 Years";
  if (yearsAhead <= 1000000000) return "Millions of Years";
  return "Billions of Years";
}

