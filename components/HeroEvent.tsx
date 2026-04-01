"use client";
import Image from "next/image";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "./CalendarIcon";
import EventTagGroup, { type EventExtraTag } from "./EventTagGroup";

export type HeroEventData = {
  id: string;
  title: string;
  description: string;
  tag?: string;
  extraTags?: EventExtraTag[];
  timeSection?: "Next 100 Years" | "Next 10,000 Years" | "Millions of Years" | "Billions of Years";
  date: string;
  detailedExplanation: string;
  image: string;
  whyItMatters?: string;
  whatYoullSee?: string;
  keyFacts?: string[];
};

type HeroEventProps = {
  events: HeroEventData[];
  onActiveEventChange?: (event: HeroEventData) => void;
  onExplore?: (event: HeroEventData) => void;
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

  const hasSpecificTime =
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0;

  if (hasSpecificTime) {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function formatEventYear(dateStr: string) {
  const year = new Date(dateStr).getUTCFullYear();
  if (!Number.isFinite(year)) return "Unknown";
  return year.toLocaleString("en-US");
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
    return {
      value: Math.round(years / 1000000000).toLocaleString("en-US"),
      unit: "billion years",
    };
  }
  if (years >= 1000000) {
    return {
      value: Math.round(years / 1000000).toLocaleString("en-US"),
      unit: "million years",
    };
  }
  return {
    value: years.toLocaleString("en-US"),
    unit: "years",
  };
}

function HeroFlipSegment({
  label,
  valueText,
}: {
  label: string;
  valueText: string;
}) {
  const valueClassName = [
    "text-center text-[26px] font-bold leading-none tabular-nums text-ds-neutral-50 sm:text-[30px] md:text-[34px] lg:text-[38px]",
    "font-sans",
    label === "MIN" ? "tracking-[2px]" : "tracking-tight",
  ].join(" ");

  return (
    <div
      className="relative flex h-[102px] min-h-[92px] w-full min-w-0 flex-1 select-none flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-[var(--ds-neutral-850)] bg-ds-neutral-950 px-2 py-2 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:gap-2 md:min-h-[102px] md:rounded-2xl md:py-2"
      style={{ height: "100%" }}
      aria-label={`${label}: ${valueText}`}
    >
      <span className={valueClassName}>
        {valueText}
      </span>
      <span className="w-full text-center font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-ds-neutral-400 md:text-[12px]">
        {label}
      </span>
    </div>
  );
}

function getNearestUpcomingEventIndex(events: HeroEventData[]) {
  const now = Date.now();
  const nearestUpcomingIndex = events.findIndex(
    (event) => new Date(event.date).getTime() >= now
  );
  return nearestUpcomingIndex >= 0 ? nearestUpcomingIndex : Math.max(0, events.length - 1);
}

export default function HeroEvent({
  events,
  onActiveEventChange,
  onExplore,
}: HeroEventProps) {
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  );
  const eventsKey = useMemo(
    () => sortedEvents.map((event) => `${event.id}:${event.date}`).join("|"),
    [sortedEvents]
  );
  const nearestUpcomingIndex = useMemo(
    () => getNearestUpcomingEventIndex(sortedEvents),
    [eventsKey]
  );
  const [activeIndex, setActiveIndex] = useState(() =>
    getNearestUpcomingEventIndex(sortedEvents)
  );
  const [displayIndex, setDisplayIndex] = useState(() =>
    getNearestUpcomingEventIndex(sortedEvents)
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Re-initialize only when source events list actually changes.
    setActiveIndex(nearestUpcomingIndex);
    setDisplayIndex(nearestUpcomingIndex);
    setIsVisible(true);
  }, [eventsKey, nearestUpcomingIndex]);

  useEffect(() => {
    if (activeIndex === displayIndex) return;

    setIsVisible(false);
    const timeoutId = setTimeout(() => {
      setDisplayIndex(activeIndex);
      requestAnimationFrame(() => setIsVisible(true));
    }, 180);

    return () => clearTimeout(timeoutId);
  }, [activeIndex, displayIndex]);

  const activeEvent = sortedEvents[displayIndex] ?? sortedEvents[0];
  const countdown = useCountdown(activeEvent.date);
  const showLongTermYearsOnly = isLongTermEvent(activeEvent);
  const yearsRemaining = getYearsRemaining(activeEvent.date);
  const longTermCountdown = formatLongTermYears(yearsRemaining);
  const normalizedYears = Math.floor(countdown.days / 365);
  const normalizedDays = countdown.days % 365;
  const currentYear = new Date().getUTCFullYear();
  const maxEventYearValue = new Date(
    sortedEvents[sortedEvents.length - 1]?.date ?? Date.now()
  ).getUTCFullYear();
  const maxEventYearLabel = Number.isFinite(maxEventYearValue)
    ? maxEventYearValue.toLocaleString("en-US")
    : "5B years ahead";
  const sliderProgress =
    sortedEvents.length > 1 ? (activeIndex / (sortedEvents.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!activeEvent) return;
    onActiveEventChange?.(activeEvent);
  }, [activeEvent, onActiveEventChange]);

  if (!activeEvent) return null;

  return (
    <section className="relative flex h-fit w-full flex-col overflow-hidden rounded-3xl border border-[var(--ds-neutral-800)] bg-ds-neutral-950">
      <div
        className={`grid w-full flex-1 gap-0 border-0 bg-[var(--app-surface-elevated)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)] ${
          isVisible
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-0 -translate-y-0.5 blur-[1.5px]"
        }`}
      >
        {/* Left: visual */}
        <div className="hero-event__image-wrap relative min-h-[220px] overflow-hidden rounded-3xl md:rounded-r-none md:rounded-tl-3xl md:rounded-bl-none">
          <Image
            src={activeEvent.image}
            alt={activeEvent.title}
            fill
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="hero-event__image object-cover"
          />

          <EventTagGroup
            primaryTag={activeEvent.tag}
            extraTags={activeEvent.extraTags}
          />
        </div>

        {/* Right: information */}
        <div
          className="flex h-full flex-col justify-between gap-2 rounded-3xl px-10 pb-8 pt-10 md:rounded-l-none md:rounded-tr-3xl md:rounded-br-none md:px-10 md:pb-8 md:pt-10"
          style={{ backgroundColor: "var(--app-surface-elevated)" }}
        >
          <div className="flex flex-col gap-1.5">
            <h3 className="m-0 font-sans font-semibold text-ds-neutral-50 text-[16px] leading-[24px] sm:text-[24px] sm:leading-[32px]">
              {activeEvent.title}
            </h3>
            <p className="m-0 min-h-[40px] max-w-[640px] font-sans text-[16px] leading-[20px] text-ds-neutral-400">
              {activeEvent.description}
            </p>
          </div>

          {/* Date + countdown share one stack; adjust gap via .hero-event__date-countdown */}
          <div className="mt-6 flex h-full flex-col gap-3">
            <div className="hero-event__date-countdown flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 type-body-tight text-ds-neutral-300">
                <span className="event-card__date-icon">
                  <CalendarIcon className="h-6 w-6 text-ds-neutral-500" />
                </span>
                <span>{formatDate(activeEvent.date)}</span>
              </div>

              {countdown.isPast ? (
                <p className="type-body-medium-tight text-ds-success-300">
                  This event has already occurred.
                </p>
              ) : showLongTermYearsOnly ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-[var(--ds-neutral-800)] bg-ds-neutral-1000 px-4 py-3 md:px-6 md:py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="type-countdown-value-regular tabular-nums">
                      {longTermCountdown.value}
                    </span>
                    <span className="font-sans text-[24px] leading-[32px] font-normal text-ds-neutral-500">
                      {longTermCountdown.unit}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="hero-countdown flex h-fit flex-nowrap items-stretch justify-between gap-2 sm:gap-2.5 md:gap-2">
                  {[
                    { label: "YEARS", value: normalizedYears },
                    { label: "DAYS", value: normalizedDays },
                    { label: "HRS", value: countdown.hours },
                    { label: "MIN", value: countdown.minutes },
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
              onClick={() => onExplore?.(activeEvent)}
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

      {sortedEvents.length > 1 ? (
        <div className="flex h-fit flex-col gap-2 border-t border-[var(--ds-neutral-800)] bg-ds-neutral-950 px-5 pb-10 pt-8 md:px-8 md:pb-6">
          <div className="mb-3 flex !items-end justify-end gap-0">
            <div className="ml-3 flex w-full items-center">
              <label
                htmlFor="hero-event-time-slider"
                className="block font-sans text-[14px] font-semibold uppercase tracking-[0.18em] text-ds-neutral-00"
              >
                Timeline{" "}
                <span className="font-normal normal-case tracking-normal text-ds-neutral-400">
                  ( Drag to explore )
                </span>
              </label>
            </div>
            <div className="flex h-full items-end justify-end">
              <span className="flex items-start justify-end gap-3 pr-3 font-sans text-[14px] leading-[18px] text-ds-neutral-500">
                Selected:{" "}
                <span className="font-bold text-[18px] text-ds-neutral-00">
                  {formatEventYear(activeEvent.date)}
                </span>
              </span>
            </div>
          </div>
          <div
            className="hero-event-slider-wrap"
            data-at-start={activeIndex === 0 ? "true" : "false"}
            style={{ "--slider-progress": `${sliderProgress}%` } as CSSProperties}
          >
            <div aria-hidden="true" className="hero-event-slider-visual" />
            <div aria-hidden="true" className="hero-event-slider-dots">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} className="hero-event-slider-dot" />
              ))}
            </div>
            <input
              id="hero-event-time-slider"
              className="hero-event-slider"
              data-at-start={activeIndex === 0 ? "true" : "false"}
              type="range"
              min={0}
              max={sortedEvents.length - 1}
              step={1}
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.currentTarget.value))}
              aria-label="Timeline slider"
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-3 font-sans text-[13px] text-ds-neutral-500">
            <span style={{ color: "rgba(107, 114, 128, 1)" }}>Now</span>
            <span style={{ color: "rgba(107, 114, 128, 1)" }}>{maxEventYearLabel}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}