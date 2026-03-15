"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HeroEventData } from "./HeroEvent";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function useCountdown(targetDate: string): Countdown {
  const getDiff = (): Countdown => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (Number.isNaN(target)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
    }

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isPast: false };
  };

  const [countdown, setCountdown] = useState<Countdown>(getDiff);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getDiff());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

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
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

type EventCardProps = {
  event: HeroEventData;
};

function EventCard({ event }: EventCardProps) {
  const countdown = useCountdown(event.date);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/80 p-4 transition hover:border-sky-500/70">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="64px"
            className="object-cover opacity-80"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {event.title}
          </h3>
          <p className="line-clamp-2 text-[0.7rem] text-zinc-500">
            {event.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-[0.6rem] uppercase tracking-[0.26em] text-zinc-500">
          Time until event
        </p>
        {countdown.isPast ? (
          <p className="text-xs font-medium text-emerald-300">
            Event in the past
          </p>
        ) : (
          <div className="flex items-stretch justify-center gap-2 font-mono text-zinc-100">
            {[
              { label: "D", value: countdown.days },
              { label: "H", value: countdown.hours },
              { label: "M", value: countdown.minutes },
            ].map((segment) => (
              <div
                key={segment.label}
                className="flex min-w-[3.4rem] flex-col items-center justify-center rounded-2xl bg-zinc-900/95 px-3 py-2 ring-1 ring-zinc-800/80"
              >
                <span className="text-2xl font-semibold leading-none tabular-nums">
                  {segment.value.toString().padStart(2, "0")}
                </span>
                <span className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-zinc-500">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[0.65rem] text-zinc-500">
          {formatDate(event.date)}
        </p>
        <button
          type="button"
          className="mt-1 inline-flex items-center justify-center rounded-full bg-zinc-100 px-3 py-1.5 text-[0.7rem] font-medium text-black shadow-sm shadow-sky-500/40 transition hover:bg-white"
        >
          Learn more
        </button>
      </div>
    </article>
  );
}

