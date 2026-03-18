"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroEventData = {
  id: string;
  title: string;
  description: string;
  date: string;
  detailedExplanation: string;
  image: string;
};

type HeroEventProps = {
  event: HeroEventData;
};

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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

export default function HeroEvent({ event }: HeroEventProps) {
  const countdown = useCountdown(event.date);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-[var(--color-zinc-800)] bg-zinc-950">
      <div className="grid w-full gap-0 border-0 bg-[var(--color-zinc-800)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)]">
        {/* Left: visual */}
        <div className="relative min-h-[220px] overflow-hidden rounded-3xl md:rounded-r-none md:rounded-l-3xl">
          <Image
            src={event.image}
            alt={event.title}
            fill
            priority
            className="object-cover"
          />

          {/* Category badge placeholder (top-left) */}
          <div className="absolute rounded-full border border-[var(--color-zinc-800)] bg-[var(--color-zinc-800)] px-3 py-1 text-[0.68rem] font-medium text-zinc-200">
            Solar system
          </div>
        </div>

        {/* Right: information */}
        <div
          className="flex flex-col justify-between gap-4 rounded-3xl px-6 py-6 md:rounded-l-none md:rounded-r-3xl md:px-8 md:py-7"
          style={{ background: "unset", backgroundColor: "var(--color-zinc-900)" }}
        >
          <div className="flex flex-col space-y-2">
            <h1 className="text-lg font-semibold leading-snug text-zinc-50 md:text-xl">
              {event.title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              {event.description}
            </p>
          </div>

          {/* Date row + Countdown */}
          <div className="mt-6 flex h-full flex-col gap-0">
            <div className="inline-flex items-center gap-1 text-sm text-zinc-300">
              <span className="event-card__date-icon">
                <CalendarIcon className="h-3.5 w-3.5" />
              </span>
              <span>{formatDate(event.date)}</span>
            </div>

            {countdown.isPast ? (
              <p className="mt-1 text-sm font-medium text-emerald-300">
                This event has already occurred.
              </p>
            ) : (
              <div className="mt-1 hero-countdown flex flex-nowrap items-center justify-between gap-2 text-zinc-100">
                {[
                  { label: "DAYS", value: countdown.days },
                  { label: "HRS", value: countdown.hours },
                  { label: "MIN", value: countdown.minutes },
                  { label: "SEC", value: countdown.seconds },
                ].map((segment) => (
                  <div
                    key={segment.label}
                    className="flex w-full min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-[var(--color-zinc-800)] bg-black px-4 py-3 md:px-6 md:py-4"
                  >
                    <span className="text-2xl leading-none tabular-nums md:text-3xl">
                      {segment.value.toString().padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-[0.6rem] tracking-[0.22em] text-zinc-400">
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200"
            >
              <span className="event-card__explore-icon">
                <img src="/icons/rocket.svg" width="18" height="18" />
              </span>
              <span className="text-sm font-medium leading-[22px]">
                Explore event
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}