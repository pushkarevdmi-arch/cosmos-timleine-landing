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
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-950">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)]">
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
          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[0.68rem] font-medium text-zinc-200">
            Solar system
          </div>
        </div>

        {/* Right: information */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-zinc-950 px-6 py-6 md:rounded-l-none md:rounded-r-3xl md:px-8 md:py-7">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold leading-snug text-zinc-50 md:text-xl">
              {event.title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-300">
              {event.description}
            </p>

            {/* Date row */}
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[0.7rem]">
                📅
              </span>
              <span>{formatDate(event.date)}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-4 space-y-4">
            {countdown.isPast ? (
              <p className="text-sm font-medium text-emerald-300">
                This event has already occurred.
              </p>
            ) : (
              <div className="flex flex-wrap items-stretch gap-2 font-mono text-zinc-100 md:gap-3">
                {[
                  { label: "DAYS", value: countdown.days },
                  { label: "HRS", value: countdown.hours },
                  { label: "MIN", value: countdown.minutes },
                  { label: "SEC", value: countdown.seconds },
                ].map((segment) => (
                  <div
                    key={segment.label}
                    className="flex min-w-[4.5rem] flex-1 flex-col items-center justify-center rounded-xl bg-black px-4 py-3 md:min-w-[5.25rem] md:px-6 md:py-4"
                  >
                    <span className="text-2xl font-semibold leading-none tabular-nums md:text-3xl">
                      {segment.value.toString().padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-[0.6rem] tracking-[0.22em] text-zinc-400">
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Explore link */}
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 hover:text-indigo-200"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[0.6rem]">
                ⭑
              </span>
              <span>Explore event</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

