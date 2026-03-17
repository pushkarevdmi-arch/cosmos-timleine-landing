"use client";

import type { HeroEventData } from "./HeroEvent";
import EventCard from "./EventCard";

type EventGridProps = {
  events: HeroEventData[];
};

export default function EventGrid({ events }: EventGridProps) {
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
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
