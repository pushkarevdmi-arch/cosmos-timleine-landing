"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CalendarIcon } from "./CalendarIcon";

export type HeroEventData = {
  id: string;
  title: string;
  description: string;
  tag?: string;
  timeSection?: "Next 100 Years" | "Next 10,000 Years" | "Millions of Years" | "Billions of Years";
  date: string;
  detailedExplanation: string;
  image: string;
  whyItMatters?: string;
  whatYoullSee?: string;
  keyFacts?: string[];
};

type HeroEventProps = {
  event: HeroEventData;
};

const LONG_TERM_SECTIONS = new Set([
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
]);

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

function isLongTermEvent(event: HeroEventData) {
  if (event.timeSection && LONG_TERM_SECTIONS.has(event.timeSection)) {
    return true;
  }

  const eventYear = new Date(event.date).getUTCFullYear();
  if (!Number.isFinite(eventYear)) return false;
  const yearsAhead = Math.max(0, eventYear - new Date().getUTCFullYear());
  return yearsAhead > 100;
}

function getYearsRemaining(dateStr: string) {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target) || target <= now) return 0;
  const yearMs = 1000 * 60 * 60 * 24 * 365;
  return Math.floor((target - now) / yearMs);
}

function formatLongTermYears(years: number) {
  if (years >= 1000000000) {
    return `${Math.round(years / 1000000000).toLocaleString("en-US")} billion years`;
  }
  if (years >= 1000000) {
    return `${Math.round(years / 1000000).toLocaleString("en-US")} million years`;
  }
  return `${years.toLocaleString("en-US")} years`;
}

function HeroFlipSegment({
  label,
  valueText,
}: {
  label: string;
  valueText: string;
}) {
  return (
    <div
      className="relative flex min-h-[92px] w-full min-w-0 flex-1 select-none flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-[var(--ds-neutral-850)] bg-ds-neutral-950 px-2 py-4 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:gap-2 md:min-h-[112px] md:rounded-2xl md:py-5"
      aria-label={`${label}: ${valueText}`}
    >
      <span className="text-center font-sans text-[26px] font-bold leading-none tabular-nums tracking-tight text-ds-neutral-50 sm:text-[30px] md:text-[34px] lg:text-[38px]">
        {valueText}
      </span>
      <span className="w-full text-center font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-ds-neutral-400 md:text-[12px]">
        {label}
      </span>
    </div>
  );
}

export default function HeroEvent({ event }: HeroEventProps) {
  const countdown = useCountdown(event.date);
  const showLongTermYearsOnly = isLongTermEvent(event);
  const yearsRemaining = getYearsRemaining(event.date);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-[var(--ds-neutral-800)] bg-ds-neutral-950">
      <div className="grid w-full gap-0 border-0 bg-[var(--ds-neutral-800)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)]">
        {/* Left: visual */}
        <div className="relative min-h-[220px] overflow-hidden rounded-3xl md:rounded-r-none md:rounded-l-3xl">
          <Image
            src={event.image}
            alt={event.title}
            fill
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />

          {/* Category badge (match small cards) */}
          <div className="event-card__category">
            {event.tag ?? "Solar system"}
          </div>
        </div>

        {/* Right: information */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-[var(--ds-neutral-900)] px-6 py-6 md:rounded-l-none md:rounded-r-3xl md:px-8 md:py-7">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-sans font-semibold text-ds-neutral-50 text-[16px] leading-[24px] sm:text-[20px] sm:leading-[28px]">
              {event.title}
            </h1>
            <p className="m-0 max-w-xl font-sans text-[16px] leading-[20px] text-ds-neutral-400">
              {event.description}
            </p>
          </div>

          {/* Date + countdown share one stack; adjust gap via .hero-event__date-countdown */}
          <div className="mt-6 flex h-full flex-col gap-2">
            <div className="hero-event__date-countdown flex flex-col gap-1.5">
              <div className="inline-flex items-center gap-1 type-body-tight text-ds-neutral-300">
                <span className="event-card__date-icon">
                  <CalendarIcon className="h-5 w-5 text-ds-neutral-500" />
                </span>
                <span>{formatDate(event.date)}</span>
              </div>

              {countdown.isPast ? (
                <p className="type-body-medium-tight text-ds-success-300">
                  This event has already occurred.
                </p>
              ) : showLongTermYearsOnly ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-[var(--ds-neutral-800)] bg-ds-neutral-1000 px-4 py-3 md:px-6 md:py-4">
                  <span className="type-countdown-value-regular tabular-nums">
                    {formatLongTermYears(yearsRemaining)}
                  </span>
                </div>
              ) : (
                <div className="hero-countdown flex flex-nowrap items-stretch justify-between gap-2 sm:gap-2.5 md:gap-1.5">
                  {[
                    { label: "DAYS", value: countdown.days },
                    { label: "HRS", value: countdown.hours },
                    { label: "MIN", value: countdown.minutes },
                    { label: "SEC", value: countdown.seconds },
                  ].map((segment) => (
                    <HeroFlipSegment
                      key={segment.label}
                      label={segment.label}
                      valueText={segment.value.toString().padStart(2, "0")}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="group mt-3 inline-flex cursor-pointer items-center gap-1.5"
            >
              <span className="event-card__explore-icon">
                <img src="/icons/rocket.svg" width="18" height="18" />
              </span>
              <span className="type-button-label group-hover:text-[var(--ds-primary-200)]">
                Explore event
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}