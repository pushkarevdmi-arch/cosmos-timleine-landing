"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";
import { groupEventsByTimeSection } from "@/utils/eventSections";

type EventGridProps = {
  events: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
};

/** Cards stick below expanded category bar (top-0 strip + pt-6 + label + pb-10) */
const MOBILE_CARD_STICKY_TOP_CLASS = "max-sm:top-[7rem]";

/**
 * Dim the previous card only once the next card’s face overlaps it vertically
 * by at least this many pixels (refs measure `.event-grid-mobile-uniform`, not
 * the tall sticky shell).
 */
const OVERLAP_FACE_MIN_PX = 16;

/** Pull following card up so it peeks below the current slide (mobile, not last in section) */
const MOBILE_CARD_OVERLAP_PULL_CLASS = "max-sm:-mb-[22vh]";

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
  const cardFaceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionIds = sectionEvents.map((e) => e.id).join(",");

  const [dimUnder, setDimUnder] = useState<boolean[]>(() =>
    sectionEvents.map(() => false)
  );

  /** Mobile: index of card under pointer — previous card gets a dim */
  const [pointerOverIndex, setPointerOverIndex] = useState<number | null>(null);

  const measureDim = useCallback(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    if (mq.matches) {
      setDimUnder(sectionEvents.map(() => false));
      setPointerOverIndex(null);
      return;
    }
    const n = sectionEvents.length;
    const under = sectionEvents.map((_, i) => {
      if (i >= n - 1) return false;
      const elPrev = cardFaceRefs.current[i];
      const elNext = cardFaceRefs.current[i + 1];
      if (!elPrev || !elNext) return false;
      const pr = elPrev.getBoundingClientRect();
      const nr = elNext.getBoundingClientRect();
      const overlapY = Math.min(pr.bottom, nr.bottom) - Math.max(pr.top, nr.top);
      return overlapY >= OVERLAP_FACE_MIN_PX;
    });
    setDimUnder((prev) => {
      if (
        prev.length === under.length &&
        prev.every((v, j) => v === under[j])
      ) {
        return prev;
      }
      return under;
    });
  }, [sectionEvents]);

  useEffect(() => {
    cardFaceRefs.current.length = sectionEvents.length;
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
        className={`col-span-full max-sm:-mx-4 max-sm:mb-0 max-sm:sticky max-sm:top-0 max-sm:z-auto max-sm:bg-ds-neutral-1000 max-sm:px-4 max-sm:pt-6 max-sm:pb-10 sm:mx-0 sm:mb-1 sm:px-0 sm:pb-0 sm:pt-0 sm:relative sm:top-auto sm:z-auto sm:bg-transparent ${
          groupIndex === 0 ? "mt-2" : "mt-8"
        }`}
        style={{ zIndex: headerZ }}
      >
        <div className="flex items-center gap-3 pt-6">
          <span className="type-era-label text-ds-neutral-00">{section}</span>
          <span className="h-px flex-1 bg-ds-neutral-800/80" />
        </div>
      </div>

      {sectionEvents.map((event, indexInSection) => {
        const dimUnderScroll = dimUnder[indexInSection];
        const dimUnderPointer =
          pointerOverIndex !== null &&
          pointerOverIndex === indexInSection + 1;
        const showUnderDim = dimUnderScroll || dimUnderPointer;

        return (
        <div
          key={event.id}
          className={[
            "max-sm:sticky max-sm:h-auto max-sm:min-h-[88dvh] max-sm:bg-ds-neutral-1000 max-sm:flex max-sm:items-start max-sm:justify-center max-sm:pt-1 sm:h-full",
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
            ref={(el) => {
              cardFaceRefs.current[indexInSection] = el;
            }}
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
            <div className="relative z-[2] h-full">
              <EventCard event={event} onExplore={onExplore} />
            </div>
            {/* Above card: previous feels inactive once the next card enters its zone */}
            <div
              className={`pointer-events-none absolute inset-0 z-[3] rounded-3xl bg-ds-neutral-950/60 transition-opacity duration-300 ease-out sm:hidden ${
                showUnderDim ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
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

  const groups = groupEventsByTimeSection(events);

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
