"use client";

import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";
import { groupEventsByTimeSection } from "@/utils/eventSections";
import { useLocale } from "@/context/LocaleContext";

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
  const { timeRangeLabel } = useLocale();

  return (
    <div className="contents">
      <div
        className="col-span-full mx-0 mb-1 bg-transparent px-0 pb-0 pt-0 shadow-none"
      >
        <div className="flex items-center gap-4 bg-ds-neutral-1000 px-0 pb-6 pt-16 sm:px-6">
          <span
            className="h-px min-w-0 flex-1 bg-ds-neutral-800"
            aria-hidden
          />
          <span className="type-era-label shrink-0 text-center text-ds-neutral-00">
            {timeRangeLabel(section)}
          </span>
          <span
            className="h-px min-w-0 flex-1 bg-ds-neutral-800"
            aria-hidden
          />
        </div>
      </div>

      {sectionEvents.map((event) => {
        return (
          <div
            key={event.id}
            className="event-grid-mobile-uniform relative h-fit w-full max-sm:max-w-[min(100%,28rem)] max-sm:justify-self-center self-start"
          >
            <EventCard event={event} onExplore={onExplore} />
          </div>
        );
      })}
    </div>
  );
}

export default function EventGrid({ events, onExplore }: EventGridProps) {
  const { t } = useLocale();

  if (!events.length) {
    return (
      <p className="type-body-tight text-ds-neutral-500">
        {t("events.gridEmpty")}
      </p>
    );
  }

  const groups = groupEventsByTimeSection(events);

  return (
    <div className="grid items-stretch gap-8 md:grid-cols-2">
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
