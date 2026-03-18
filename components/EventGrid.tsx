"use client";

import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";

type EventGridProps = {
  events: HeroEventData[];
  onExplore?: (event: HeroEventData) => void;
};

export default function EventGrid({ events, onExplore }: EventGridProps) {
  if (!events.length) {
    return (
      <p className="text-sm text-zinc-500">
        No other events are currently in view. Add more to extend your cosmic
        journey.
      </p>
    );
  }

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="h-full"
          onClick={(e) => {
            if (!onExplore) return;
            const target = e.target as HTMLElement | null;
            if (!target || !target.closest) return;

            const button = target.closest("button");
            if (!button) return;

            const hasExploreIcon = button.querySelector(
              ".event-card__explore-icon"
            );
            if (hasExploreIcon) {
              onExplore(event);
            }
          }}
        >
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}
