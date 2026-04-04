"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";
import { getEventCalendarYear } from "@/utils/eventDate";

type EventGridProps = {
  events: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
};

type SectionGroup = {
  section: string;
  events: HeroEventData[];
};

/** Category label: 24px from top (top-6) + line + padding; cards stick below */
const MOBILE_CARD_STICKY_TOP_CLASS = "max-sm:top-[4.5rem]";

/** When the next card’s top crosses this (px), the previous card dims */
const DIM_OVERLAP_PX = 100;

function groupEventsBySection(events: HeroEventData[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
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

function EventGridSection({
  section,
  sectionEvents,
  groupIndex,
  onExplore,
}: {
  section: string;
  sectionEvents: HeroEventData[];
  groupIndex: number;
  onExplore?: (event: HeroEventData) => void;
}) {
  const shellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionIds = sectionEvents.map((e) => e.id).join(",");

  const [dimPrevious, setDimPrevious] = useState<boolean[]>(() =>
    sectionEvents.map(() => false)
  );

  const measureDim = useCallback(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    if (mq.matches) {
      setDimPrevious(sectionEvents.map(() => false));
      return;
    }
    const n = sectionEvents.length;
    const next = sectionEvents.map((_, i) => {
      if (i >= n - 1) return false;
      const elNext = shellRefs.current[i + 1];
      if (!elNext) return false;
      return elNext.getBoundingClientRect().top < DIM_OVERLAP_PX;
    });
    setDimPrevious((prev) =>
      prev.length === next.length && prev.every((v, j) => v === next[j])
        ? prev
        : next
    );
  }, [sectionEvents]);

  useEffect(() => {
    shellRefs.current.length = sectionEvents.length;
    measureDim();
    window.addEventListener("scroll", measureDim, { passive: true });
    window.addEventListener("resize", measureDim);
    const mq = window.matchMedia("(min-width: 640px)");
    mq.addEventListener("change", measureDim);
    return () => {
      window.removeEventListener("scroll", measureDim);
      window.removeEventListener("resize", measureDim);
      mq.removeEventListener("change", measureDim);
    };
  }, [measureDim, sectionIds, sectionEvents.length]);

  const headerZ = groupIndex * 1000 + 100;

  return (
    <>
      <div
        className="col-span-full mt-2 mb-1 max-sm:sticky max-sm:top-6 max-sm:bg-ds-neutral-1000 max-sm:pb-2 sm:relative sm:top-auto sm:z-auto sm:bg-transparent"
        style={{ zIndex: headerZ }}
      >
        <div className="flex items-center gap-3">
          <span className="type-era-label text-ds-neutral-00">{section}</span>
          <span className="h-px flex-1 bg-ds-neutral-800/80" />
        </div>
      </div>

      {sectionEvents.map((event, indexInSection) => (
        <div
          key={event.id}
          ref={(el) => {
            shellRefs.current[indexInSection] = el;
          }}
          className={`h-full max-sm:sticky ${MOBILE_CARD_STICKY_TOP_CLASS} max-sm:min-h-[100dvh] max-sm:flex max-sm:items-center max-sm:justify-center sm:static sm:z-auto sm:min-h-0 sm:block`}
          style={{
            zIndex: groupIndex * 1000 + 10 + indexInSection + 1,
          }}
        >
          <div className="relative h-full w-full max-sm:max-w-[min(100%,28rem)]">
            <div
              className={`pointer-events-none absolute inset-0 z-[1] rounded-3xl bg-ds-neutral-1000/55 transition-opacity duration-300 ease-out sm:hidden ${
                dimPrevious[indexInSection] ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
            <div className="relative z-[2] h-full">
              <EventCard event={event} onExplore={onExplore} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function EventGrid({ events, onExplore }: EventGridProps) {
  if (!events.length) {
    return (
      <p className="type-body-tight text-ds-neutral-500">
        No other events are currently in view. Add more to extend your cosmic
        journey.
      </p>
    );
  }

  const groups = groupEventsBySection(events);

  return (
    <div className="grid items-stretch gap-6 sm:grid-cols-2">
      {groups.map(({ section, events: sectionEvents }, groupIndex) => (
        <div
          key={`${section}-${sectionEvents[0]?.id ?? groupIndex}`}
          className="contents"
        >
          <EventGridSection
            section={section}
            sectionEvents={sectionEvents}
            groupIndex={groupIndex}
            onExplore={onExplore}
          />
        </div>
      ))}
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
