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

/** Cards stick below expanded category bar (top-0 strip + pt-6 + label + pb-10) */
const MOBILE_CARD_STICKY_TOP_CLASS = "max-sm:top-[7rem]";

/** When the next card’s top crosses this (px), the previous card dims */
const DIM_OVERLAP_PX = 120;

/** Pull following card up so it peeks below the current slide (mobile, not last in section) */
const MOBILE_CARD_OVERLAP_PULL_CLASS = "max-sm:-mb-[16vh]";

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

  const [dim, setDim] = useState<{
    under: boolean[];
    over: boolean[];
  }>(() => ({
    under: sectionEvents.map(() => false),
    over: sectionEvents.map(() => false),
  }));

  /** Mobile: index of card under pointer — previous card gets a dim */
  const [pointerOverIndex, setPointerOverIndex] = useState<number | null>(null);

  const measureDim = useCallback(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    if (mq.matches) {
      setDim({
        under: sectionEvents.map(() => false),
        over: sectionEvents.map(() => false),
      });
      setPointerOverIndex(null);
      return;
    }
    const n = sectionEvents.length;
    const under = sectionEvents.map((_, i) => {
      if (i >= n - 1) return false;
      const elNext = shellRefs.current[i + 1];
      if (!elNext) return false;
      return elNext.getBoundingClientRect().top < DIM_OVERLAP_PX;
    });
    const over = sectionEvents.map((_, j) => {
      if (j < 1) return false;
      const el = shellRefs.current[j];
      if (!el) return false;
      return el.getBoundingClientRect().top < DIM_OVERLAP_PX;
    });
    setDim((prev) => {
      if (
        prev.under.length === under.length &&
        prev.over.length === over.length &&
        prev.under.every((v, j) => v === under[j]) &&
        prev.over.every((v, j) => v === over[j])
      ) {
        return prev;
      }
      return { under, over };
    });
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
        className="col-span-full mt-2 max-sm:-mx-4 max-sm:mb-0 max-sm:sticky max-sm:top-0 max-sm:z-auto max-sm:bg-ds-neutral-1000 max-sm:px-4 max-sm:pt-6 max-sm:pb-10 sm:mx-0 sm:mb-1 sm:px-0 sm:pb-0 sm:pt-0 sm:relative sm:top-auto sm:z-auto sm:bg-transparent"
        style={{ zIndex: headerZ }}
      >
        <div className="flex items-center gap-3">
          <span className="type-era-label text-ds-neutral-00">{section}</span>
          <span className="h-px flex-1 bg-ds-neutral-800/80" />
        </div>
      </div>

      {sectionEvents.map((event, indexInSection) => {
        const dimUnderScroll = dim.under[indexInSection];
        const dimUnderPointer =
          pointerOverIndex !== null &&
          pointerOverIndex === indexInSection + 1;
        const showUnderDim = dimUnderScroll || dimUnderPointer;

        return (
        <div
          key={event.id}
          ref={(el) => {
            shellRefs.current[indexInSection] = el;
          }}
          className={[
            "max-sm:sticky max-sm:h-auto max-sm:min-h-[100dvh] max-sm:bg-ds-neutral-1000 max-sm:flex max-sm:items-start max-sm:justify-center max-sm:pt-1 sm:h-full",
            MOBILE_CARD_STICKY_TOP_CLASS,
            indexInSection < sectionEvents.length - 1
              ? MOBILE_CARD_OVERLAP_PULL_CLASS
              : "",
            "sm:static sm:z-auto sm:min-h-0 sm:block",
          ].join(" ")}
          style={{
            zIndex: groupIndex * 1000 + 10 + indexInSection + 1,
          }}
        >
          <div
            className="event-grid-mobile-uniform relative w-full max-sm:max-w-[min(100%,28rem)] sm:h-full"
            onPointerEnter={() => {
              if (window.matchMedia("(min-width: 640px)").matches) return;
              setPointerOverIndex(indexInSection);
            }}
            onPointerLeave={(e) => {
              if (window.matchMedia("(min-width: 640px)").matches) return;
              const next = e.relatedTarget;
              if (
                next instanceof Node &&
                e.currentTarget.contains(next)
              ) {
                return;
              }
              setPointerOverIndex((current) =>
                current === indexInSection ? null : current
              );
            }}
          >
            {/* Card underneath: scroll stack or pointer on the next card */}
            <div
              className={`pointer-events-none absolute inset-0 z-[1] rounded-3xl bg-ds-neutral-1000/55 transition-opacity duration-300 ease-out sm:hidden ${
                showUnderDim ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
            {/* This card sliding up onto the previous one */}
            <div
              className={`pointer-events-none absolute inset-0 z-[1] rounded-3xl bg-ds-neutral-1000/40 transition-opacity duration-300 ease-out sm:hidden ${
                dim.over[indexInSection] ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
            <div className="relative z-[2] h-full">
              <EventCard event={event} onExplore={onExplore} />
            </div>
          </div>
        </div>
        );
      })}
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
    <div className="grid items-stretch gap-0 sm:grid-cols-2 sm:gap-6">
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
