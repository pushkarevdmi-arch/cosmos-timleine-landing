"use client";
import Image from "next/image";
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useState } from "react";
import {
  compareEventDateStrings,
  eventHasSpecificUtcTime,
  formatCountdownDaysDisplay,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
  formatMegaYearScaleParts,
  getHeroTimelineYearDisplay,
  HERO_TIMELINE_END_OF_TIME_LABEL,
  getApproxYearsRemaining,
  getCountdownBreakdown,
  getEventCalendarYear,
  isEventOnOrAfterNow,
} from "@/utils/eventDate";
import EventTagGroup, { type EventExtraTag } from "./EventTagGroup";

export type CountdownPrecision = "full" | "day" | "year";

export type HeroEventData = {
  id: string;
  title: string;
  date: string;
  countdownPrecision?: CountdownPrecision;
  timeCategory?: "Next 100 Years" | "Next 10,000 Years" | "Millions of Years" | "Billions of Years";
  shortDescription: string;
  mainDescription: string;
  whatYoullSee?: string;
  whyItMatters?: string;
  keyFacts?: string[];
  nextOccurrences?: string[];
  tags?: string[];
  specialTags?: EventExtraTag[];
  image: string;
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

const HIDE_HERO_DATE_SECTIONS = new Set([
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
]);

const heroTimelineLabelFont =
  "font-sans text-[17px] font-semibold leading-tight text-ds-neutral-00 sm:text-[24px] sm:leading-[24px]";

type Countdown = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function useCountdown(targetDate: string): Countdown {
  const getDiff = (): Countdown => {
    const b = getCountdownBreakdown(targetDate);
    return {
      years: b.years,
      days: b.days,
      hours: b.hours,
      minutes: b.minutes,
      seconds: b.seconds,
      isPast: b.isPast,
    };
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

function isLongTermEvent(event: HeroEventData) {
  if (event.timeCategory && LONG_TERM_SECTIONS.has(event.timeCategory)) {
    return true;
  }

  const eventYear = getEventCalendarYear(event.date);
  if (eventYear === Number.POSITIVE_INFINITY) return true;
  if (!Number.isFinite(eventYear)) return false;
  const yearsAhead = Math.max(0, eventYear - new Date().getUTCFullYear());
  return yearsAhead > 100;
}

function formatLongTermYears(years: number) {
  if (years >= 1_000_000_000_000) {
    return {
      value: Math.round(years / 1_000_000_000_000).toLocaleString("en-US"),
      unit: "tril years",
    };
  }
  if (years >= 1_000_000_000) {
    return {
      value: Math.round(years / 1_000_000_000).toLocaleString("en-US"),
      unit: "bil years",
    };
  }
  if (years >= 1_000_000) {
    return {
      value: Math.round(years / 1_000_000).toLocaleString("en-US"),
      unit: "mil years",
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
  return (
    <div
      className="hero-flip-segment relative flex min-w-0 min-h-0 w-full flex-1 basis-0 select-none flex-col items-center justify-center gap-[4px] overflow-hidden rounded-2xl border border-[var(--ds-neutral-850)] bg-ds-neutral-950 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-1 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:rounded-2xl md:py-4"
      aria-label={`${label}: ${valueText}`}
    >
      <span className="event-card__countdown-value text-center text-[20px] leading-[20px] tabular-nums sm:text-[30px] sm:leading-none md:text-[34px] lg:text-[32px] lg:leading-[36px]">
        {valueText}
      </span>
      <span className="event-card__countdown-label w-full text-center tracking-normal text-[12px] leading-[14px] sm:text-[10px] sm:leading-none md:text-[14px] md:leading-[16px]">
        {label}
      </span>
    </div>
  );
}

function getNearestUpcomingEventIndex(events: HeroEventData[]) {
  const now = Date.now();
  const nearestUpcomingIndex = events.findIndex((event) =>
    isEventOnOrAfterNow(event.date, now)
  );
  return nearestUpcomingIndex >= 0 ? nearestUpcomingIndex : Math.max(0, events.length - 1);
}

export default function HeroEvent({
  events,
  onActiveEventChange,
  onExplore,
}: HeroEventProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => compareEventDateStrings(a.date, b.date)),
    [events]
  );
  const nearestUpcomingIndex = useMemo(
    () => getNearestUpcomingEventIndex(sortedEvents),
    [sortedEvents]
  );
  const [activeIndex, setActiveIndex] = useState(() =>
    getNearestUpcomingEventIndex(sortedEvents)
  );
  const [displayIndex, setDisplayIndex] = useState(() =>
    getNearestUpcomingEventIndex(sortedEvents)
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Defer to avoid synchronous setState-in-effect warnings.
    const t = window.setTimeout(() => {
      setActiveIndex(nearestUpcomingIndex);
      setDisplayIndex(nearestUpcomingIndex);
      setIsVisible(true);
    }, 0);

    return () => window.clearTimeout(t);
  }, [nearestUpcomingIndex]);

  useEffect(() => {
    if (activeIndex === displayIndex) return;

    const hideT = window.setTimeout(() => setIsVisible(false), 0);
    const timeoutId = setTimeout(() => {
      setDisplayIndex(activeIndex);
      requestAnimationFrame(() => setIsVisible(true));
    }, 180);

    return () => {
      window.clearTimeout(hideT);
      clearTimeout(timeoutId);
    };
  }, [activeIndex, displayIndex]);

  const displayEvent = sortedEvents[displayIndex] ?? sortedEvents[0];
  const liveEvent = sortedEvents[activeIndex] ?? sortedEvents[0];
  const countdown = useCountdown(liveEvent.date);
  const showLongTermYearsOnly = isLongTermEvent(liveEvent);
  const yearsRemaining = getApproxYearsRemaining(liveEvent.date);
  const longTermCountdown = formatLongTermYears(yearsRemaining);
  const normalizedYears = countdown.years;
  const normalizedDays = countdown.days;
  const precision = liveEvent.countdownPrecision ?? "full";
  /** Same countdown + no calendar row as EventCard for long-horizon categories. */
  const useMegaYearsCountdownLayout =
    liveEvent.timeCategory === "Next 10,000 Years" ||
    liveEvent.timeCategory === "Millions of Years" ||
    liveEvent.timeCategory === "Billions of Years";
  const showHeroDateRow =
    !displayEvent.timeCategory ||
    !HIDE_HERO_DATE_SECTIONS.has(displayEvent.timeCategory);
  const useBigLongTermCountdown =
    showLongTermYearsOnly && !useMegaYearsCountdownLayout;
  const megaScale = formatMegaYearScaleParts(countdown.years);
  const heroCountdownSegments =
    precision === "year"
      ? [{ label: "YEARS" as const, value: normalizedYears }]
      : precision === "day"
        ? [
            { label: "YEARS" as const, value: normalizedYears },
            { label: "DAYS" as const, value: normalizedDays },
          ]
        : [
            { label: "YEARS" as const, value: normalizedYears },
            { label: "DAYS" as const, value: normalizedDays },
            { label: "HRS" as const, value: countdown.hours },
          ];
  const sliderProgress =
    sortedEvents.length > 1 ? (activeIndex / (sortedEvents.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!displayEvent) return;
    onActiveEventChange?.(displayEvent);
  }, [displayEvent, onActiveEventChange]);

  if (!displayEvent || !liveEvent) return null;

  const atTimelineEnd =
    sortedEvents.length > 0 && activeIndex === sortedEvents.length - 1;
  const heroTimelineYearDisplay = atTimelineEnd
    ? ({ kind: "plain" as const, text: HERO_TIMELINE_END_OF_TIME_LABEL })
    : getHeroTimelineYearDisplay(liveEvent.date);
  const showHeroYearVerbalEnd =
    atTimelineEnd ||
    (heroTimelineYearDisplay.kind === "plain" &&
      heroTimelineYearDisplay.text === HERO_TIMELINE_END_OF_TIME_LABEL);

  const handleHeroMainAreaClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onExplore) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, a, [role='button']")) return;
    onExplore(displayEvent);
  };

  return (
    <section className="relative flex h-fit w-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-[var(--ds-neutral-800)] bg-ds-neutral-950">
      <div
        onClick={onExplore ? handleHeroMainAreaClick : undefined}
        className={`grid min-w-0 w-full flex-1 gap-0 border-0 bg-[var(--app-surface-elevated)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)] ${
          onExplore ? "max-md:cursor-pointer" : ""
        } ${
          isVisible
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-0 -translate-y-0.5 blur-[1.5px]"
        }`}
      >
        {/* Left: visual */}
        <div className="hero-event__image-wrap relative h-[200px] min-h-[200px] min-w-0 overflow-hidden rounded-t-3xl rounded-b-none md:h-auto md:min-h-[220px] md:rounded-r-none md:rounded-tl-3xl md:rounded-bl-none">
          <Image
            src={displayEvent.image}
            alt={displayEvent.title}
            fill
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="hero-event__image object-cover"
          />

          <EventTagGroup
            primaryTag={displayEvent.tags?.[0]}
            specialTags={displayEvent.specialTags}
          />
        </div>

        {/* Right: information */}
        <div
          className="flex h-full min-w-0 max-w-full flex-col justify-between gap-4 rounded-3xl px-6 pb-10 pt-7 text-center md:rounded-l-none md:rounded-tr-3xl md:rounded-br-none md:pl-12 md:pr-20 md:pb-6 md:pt-10 md:text-left"
          style={{ backgroundColor: "var(--app-surface-elevated)" }}
        >
          <div className="flex w-full min-w-0 flex-col items-center gap-2 md:items-start">
            <h3 className="m-0 max-w-full break-words font-sans font-normal text-ds-neutral-50 text-[20px] leading-[28px] sm:text-[24px] sm:leading-[32px]">
              {displayEvent.title}
            </h3>
            <p className="m-0 min-w-0 w-full max-w-[640px] font-sans text-[16px] leading-[24px] text-ds-neutral-400 line-clamp-2 md:line-clamp-none md:min-h-[40px]">
              {displayEvent.shortDescription}
            </p>
          </div>

          {/* Date + countdown share one stack; adjust vertical gap between sections */}
          <div className="mt-8 flex h-full w-full min-w-0 flex-col items-center gap-2 md:mt-6 md:items-stretch">
            <div className="hero-event__date-countdown flex w-full min-w-0 flex-col gap-2">
              {showHeroDateRow ? (
                <div className="mx-1 flex flex-wrap items-center justify-center gap-2 type-body-tight text-ds-neutral-300 md:justify-start">
                  <span className="event-card__date-icon">
                    <img src="/icons/gg_calendar.svg" width="24" height="24" alt="" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-row flex-wrap items-center justify-center gap-2 text-left md:justify-start md:gap-3">
                    <span>{formatEventDateOnlyLong(displayEvent.date)}</span>
                    {eventHasSpecificUtcTime(displayEvent.date) ? (
                      <>
                        <span
                          className="h-4 w-px shrink-0 bg-ds-neutral-600"
                          aria-hidden="true"
                        />
                        <span>{formatEventTimeUtcLabel(displayEvent.date)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {countdown.isPast ? (
                <p className="type-body-medium-tight text-ds-success-300">
                  This event has already occurred.
                </p>
              ) : useMegaYearsCountdownLayout ? (
                <div className="hero-countdown hidden h-fit w-full min-w-0 self-stretch flex-nowrap items-stretch justify-stretch gap-1 md:flex md:h-24 md:gap-2 md:justify-start md:pr-20">
                  <div
                    className="relative flex min-h-0 min-w-0 w-full flex-1 basis-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-[var(--ds-neutral-850)] bg-ds-neutral-950 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-1 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:rounded-2xl md:py-2"
                    aria-label={`${megaScale.numberPart}${megaScale.scaleWord ? ` ${megaScale.scaleWord}` : ""} years from now`}
                  >
                    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center">
                      <span className="event-card__countdown-value event-card__countdown-value--mega tabular-nums sm:text-[24px] sm:font-semibold sm:leading-[24px] sm:tracking-[3px] md:text-[38px] md:leading-[38px]">
                        {megaScale.numberPart}
                      </span>
                      {megaScale.scaleWord ? (
                        <span className="font-sans text-[17px] font-semibold leading-tight text-ds-neutral-00 sm:text-[24px] sm:leading-[24px] md:text-ds-neutral-300">
                          {megaScale.scaleWord}
                        </span>
                      ) : null}
                    </div>
                    <span className="event-card__countdown-label event-card__countdown-label--from-now w-full text-center sm:text-[10px] sm:leading-none sm:tracking-[0.2em] md:text-[12px]">
                      years from now
                    </span>
                  </div>
                </div>
              ) : useBigLongTermCountdown ? (
                <div className="hidden w-full items-center justify-center rounded-xl border border-[var(--ds-neutral-800)] bg-ds-neutral-1000 px-4 py-3 md:flex md:px-6 md:py-4">
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
                <div className="hero-countdown hidden h-fit w-full min-w-0 self-stretch flex-nowrap items-stretch justify-stretch gap-1 md:flex md:h-24 md:gap-2 md:justify-start md:pr-20">
                  {heroCountdownSegments.map((segment) => (
                    <HeroFlipSegment
                      key={segment.label}
                      label={segment.label}
                      valueText={
                        segment.label === "DAYS"
                          ? formatCountdownDaysDisplay(segment.value)
                          : segment.label === "YEARS" && segment.value > 99
                            ? segment.value.toLocaleString("en-US")
                            : segment.value.toString().padStart(2, "0")
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExplore?.(displayEvent);
              }}
              className="group mt-3 hidden cursor-pointer items-center justify-center gap-1.5 md:inline-flex md:justify-start md:self-start"
            >
              <span className="event-card__explore-icon">
                <img src="/icons/rocket.svg" width="20" height="20" />
              </span>
              <span className="type-button-label group-hover:text-[var(--ds-primary-200)]">
                Explore
              </span>
            </button>
          </div>
        </div>
      </div>

      {sortedEvents.length > 1 ? (
        <div className="flex h-fit min-w-0 w-full max-w-full flex-col gap-[6px] md:gap-1 border-t border-[var(--ds-neutral-800)] bg-ds-neutral-950 px-5 pb-8 pt-6 md:px-8 md:pb-6">
          <div className="mb-3 min-w-0 text-center md:hidden">
            <label
              htmlFor="hero-event-time-slider"
              className="block cursor-pointer font-sans text-[14px] font-semibold uppercase leading-tight tracking-[0.18em] text-ds-neutral-00"
            >
              Timeline{" "}
              <span className="font-normal normal-case tracking-normal text-ds-neutral-400">
                ( Drag to explore )
              </span>
            </label>
          </div>
          <div className="mb-3 hidden !items-end justify-end gap-0 md:flex">
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
            <div className="flex h-full shrink-0 items-end justify-end">
              <span className="flex flex-wrap items-end justify-end gap-x-2 gap-y-1 pr-3 text-left align-middle font-sans text-[14px] font-normal leading-[18px] text-ds-neutral-500">
                <span className="font-sans">Year:</span>{" "}
                {heroTimelineYearDisplay.kind === "mega" ? (
                  <span className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0">
                    <span className="whitespace-nowrap font-['Dynamite'] tracking-[3px] text-[24px] font-bold leading-[24px] text-ds-neutral-00">
                      {heroTimelineYearDisplay.numberPart}
                    </span>
                    <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.scaleWord}</span>
                  </span>
                ) : showHeroYearVerbalEnd ? (
                  <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.text}</span>
                ) : (
                  <span className="whitespace-nowrap font-['Dynamite'] tracking-[3px] text-[24px] font-bold leading-[24px] text-ds-neutral-00">
                    {heroTimelineYearDisplay.text}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div
            className="hero-event-slider-wrap min-w-0 w-full max-w-full"
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
          <div className="mt-1 hidden items-center justify-between px-4 font-sans text-[14px] leading-[20px] text-ds-neutral-500 md:flex">
            <span
              className="font-sans font-normal"
              style={{ color: "rgba(107, 114, 128, 1)" }}
            >
              Now
            </span>
            <span
              className="whitespace-nowrap text-right font-sans font-normal"
              style={{ color: "rgba(107, 114, 128, 1)" }}
            >
              {HERO_TIMELINE_END_OF_TIME_LABEL}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}