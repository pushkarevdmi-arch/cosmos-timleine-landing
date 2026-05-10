"use client";

import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";
import { groupEventsByTimeSection } from "@/utils/eventSections";

type EventGridProps = {
  events: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
};

function EventGridSection({
  section,
  sectionEvents,
  onExplore,
}: {
  section: string;
  sectionEvents: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
}) {
  return (
    <div className="contents">
      <div
        className="col-span-full mx-0 mb-1 bg-transparent px-0 pb-0 pt-0 shadow-none"
      >
        <div className="flex items-center gap-3 pt-6">
          <span
            className="shrink-0 rounded-none bg-ds-bg-brand-solid h-1 w-7"
            aria-hidden
          />
          <span className="type-era-label text-ds-neutral-00">{section}</span>
        </div>
      </div>

      {sectionEvents.map((event) => {
        return (
          <div
            key={event.id}
            className="event-grid-mobile-uniform relative w-full max-sm:max-w-[min(100%,28rem)] max-sm:justify-self-center sm:h-[500px]"
          >
            <EventCard event={event} onExplore={onExplore} />
          </div>
        );
      })}
    </div>
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
    <div className="grid items-stretch gap-6 md:grid-cols-2">
      {groups.map(({ section, events: sectionEvents }, groupIndex) => (
        <EventGridSection
          key={`${section}-${sectionEvents[0]?.id ?? groupIndex}`}
          section={section}
          sectionEvents={sectionEvents}
          onExplore={onExplore}
        />
      ))}
    </div>
  );
}
