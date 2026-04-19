"use client";
import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
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
import OpenArrowGlyph from "./OpenArrowGlyph";

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
  "font-sans text-[18px] font-semibold leading-[22px] text-ds-neutral-00";

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
  radiusRole,
  grouped = false,
}: {
  label: string;
  valueText: string;
  radiusRole: "single" | "first" | "middle" | "last";
  /** Segments sit inside `.hero-countdown__segments`; segment dividers use `divide-x` on the wrapper. */
  grouped?: boolean;
}) {
  const radiusClass = grouped
    ? "rounded-none"
    : radiusRole === "single"
      ? "rounded-2xl md:rounded-2xl"
      : radiusRole === "last"
        ? "rounded-2xl md:rounded-l-none md:rounded-r-2xl"
        : radiusRole === "first"
          ? "rounded-2xl md:rounded-l-2xl md:rounded-r-none"
          : "rounded-2xl md:rounded-none";

  return (
    <div
      className={`hero-flip-segment relative flex min-w-0 min-h-0 w-full flex-1 basis-0 select-none flex-col items-center justify-center gap-[4px] overflow-hidden border-0 bg-ds-neutral-1000 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-1 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:py-4 ${radiusClass}`}
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
  const openArrowClipIdMobile = useId().replace(/:/g, "");
  const openArrowClipIdDesktop = useId().replace(/:/g, "");

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
  /** Hero panel is shorter when the calendar date row is hidden (long-horizon sections). */
  const heroPanelCompact = !showHeroDateRow;
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

  /** Calendar year in hero when the date badge is hidden (long-horizon); matches visible title (`displayEvent`). */
  const displayAtTimelineEnd =
    sortedEvents.length > 0 && displayIndex === sortedEvents.length - 1;
  const displayHeroTimelineYearDisplay = displayAtTimelineEnd
    ? { kind: "plain" as const, text: HERO_TIMELINE_END_OF_TIME_LABEL }
    : getHeroTimelineYearDisplay(displayEvent.date);
  const showDisplayHeroYearVerbalEnd =
    displayAtTimelineEnd ||
    (displayHeroTimelineYearDisplay.kind === "plain" &&
      displayHeroTimelineYearDisplay.text === HERO_TIMELINE_END_OF_TIME_LABEL);

  const handleHeroMainAreaClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onExplore) return;
    const t = e.target as HTMLElement;
    // Ignore real controls inside the hero. Do not use `[role='button']` alone: this grid has
    // role="button", so closest() would always match and block opening the details panel.
    const innerInteractive = t.closest(
      "button, a, input, select, textarea, [role='button']"
    );
    if (innerInteractive && innerInteractive !== e.currentTarget) return;
    onExplore(displayEvent);
  };

  const handleHeroMainAreaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onExplore) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onExplore(displayEvent);
    }
  };

  return (
    <section className="relative flex h-fit w-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-ds-neutral-800 bg-ds-neutral-950">
      <div
        role={onExplore ? "button" : undefined}
        tabIndex={onExplore ? 0 : undefined}
        onClick={onExplore ? handleHeroMainAreaClick : undefined}
        onKeyDown={onExplore ? handleHeroMainAreaKeyDown : undefined}
        className={`grid h-fit min-w-0 w-full gap-0 border-0 bg-[var(--app-surface-elevated)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] md:h-fit md:grid-cols-[480px_minmax(0,1fr)] ${
          onExplore ? "hero-event--interactive group cursor-pointer" : ""
        } ${
          isVisible
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-0 -translate-y-0.5 blur-[1.5px]"
        }`}
      >
        {/* Left: visual */}
        <div
          className={`hero-event__image-wrap relative h-[200px] min-h-[200px] min-w-0 overflow-hidden rounded-t-3xl rounded-b-none md:rounded-r-none md:rounded-tl-3xl md:rounded-bl-none ${
            heroPanelCompact ? "md:h-[288px] md:min-h-[288px]" : "md:h-[364px] md:min-h-[364px]"
          }`}
        >
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

          {onExplore ? (
            <div
              className="hero-event__open-hint hero-event__open-hint--on-image pointer-events-none absolute right-4 top-4 z-[11] flex size-[34px] items-center justify-center rounded-full bg-ds-neutral-1000 md:hidden"
              aria-hidden
            >
              <OpenArrowGlyph
                clipId={openArrowClipIdMobile}
                className="size-4 shrink-0 text-ds-neutral-400 transition-colors duration-200 ease-out group-hover:text-ds-text-brand group-focus-within:text-ds-text-brand"
              />
            </div>
          ) : null}
        </div>

        {/* Right: information */}
        <div
          className={`relative flex h-full min-h-0 min-w-0 max-w-full flex-col rounded-3xl px-6 pb-6 pt-6 text-center md:rounded-l-none md:rounded-tr-3xl md:rounded-br-none md:px-10 md:pb-10 md:pt-10 md:text-left xl:pr-20 ${
            heroPanelCompact
              ? "min-h-[224px] md:h-[288px] md:min-h-[288px]"
              : "min-h-[232px] md:h-[364px] md:min-h-[364px]"
          }`}
          style={{ backgroundColor: "var(--app-surface-elevated)" }}
        >
          <div className="-mb-8 flex w-full min-w-0 shrink-0 flex-col items-center gap-1 md:items-start md:gap-2">
            <h3 className="m-0 max-w-full break-words font-sans font-semibold text-ds-neutral-50 text-[18px] leading-[24px] sm:text-[28px] sm:leading-[32px] md:text-[24px] md:leading-[28px] md:line-clamp-3 md:font-normal">
              {displayEvent.title}
            </h3>
            <p className="m-0 min-w-0 w-full max-w-[640px] font-sans text-[16px] leading-[24px] text-ds-neutral-400 line-clamp-2 md:line-clamp-2 md:min-h-[48px]">
              {displayEvent.shortDescription}
            </p>
          </div>

          <div
            className="min-h-0 w-full min-w-0 flex-1 shrink basis-0"
            aria-hidden
          />

          {/* Date + countdown: flex-1 spacer fills extra min-height; -mt-4 tightens copy↔date by 16px */}
          <div className="-mt-4 flex w-full min-w-0 shrink-0 flex-col items-center gap-2 pt-0 md:items-stretch">
            <div className="hero-event__date-countdown flex w-full min-w-0 flex-col items-center gap-3 md:items-stretch">
              {showHeroDateRow ? (
                <div className="flex h-10 w-full max-w-full justify-center md:mr-5 md:w-fit md:justify-start">
                  <div
                    className="hero-event__date-badge inline-flex h-10 max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-lg border border-[var(--ds-neutral-800)] bg-ds-neutral-850 py-1 pl-3 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50 sm:gap-2.5 sm:pl-3 sm:pr-3 sm:py-1 sm:text-[16px] sm:leading-tight"
                    role="group"
                    aria-label={`Event date${eventHasSpecificUtcTime(displayEvent.date) ? " and time" : ""}`}
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center sm:h-[22px] sm:w-[22px]">
                      <img
                        src="/icons/calendar.svg"
                        width={22}
                        height={22}
                        alt=""
                        aria-hidden
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 truncate font-sans">
                      {formatEventDateOnlyLong(displayEvent.date)}
                    </span>
                    {eventHasSpecificUtcTime(displayEvent.date) ? (
                      <>
                        <span
                          className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500 sm:h-4"
                          aria-hidden="true"
                        />
                        <span className="shrink-0 whitespace-nowrap font-sans">
                          {formatEventTimeUtcLabel(displayEvent.date)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!showHeroDateRow ? (
                <div className="flex w-full max-w-full justify-center md:hidden">
                  <div
                    className="hero-event__date-badge hero-event__year-badge--mobile inline-flex min-h-10 max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-lg border border-[var(--ds-neutral-800)] bg-ds-neutral-850 px-3 py-1.5 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50"
                    role="group"
                    aria-label="Event year (approximate)"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                      <img
                        src="/icons/calendar.svg"
                        width={22}
                        height={22}
                        alt=""
                        aria-hidden
                        className="h-full w-full object-contain"
                      />
                    </span>
                    {displayHeroTimelineYearDisplay.kind === "mega" ? (
                      <span className="flex min-w-0 flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0 text-left">
                        <span className="whitespace-nowrap font-sans text-[15px] !font-bold leading-tight tracking-[0.03em] tabular-nums">
                          {displayHeroTimelineYearDisplay.numberPart}
                        </span>
                        <span className="font-sans text-[13px] font-semibold leading-tight text-ds-neutral-00">
                          {displayHeroTimelineYearDisplay.scaleWord}
                        </span>
                      </span>
                    ) : showDisplayHeroYearVerbalEnd ? (
                      <span className="max-w-full text-left font-sans text-[15px] font-semibold leading-tight text-ds-neutral-00">
                        {displayHeroTimelineYearDisplay.text}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap font-sans text-[15px] !font-bold leading-tight tracking-[0.03em] tabular-nums">
                        {displayHeroTimelineYearDisplay.text}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {countdown.isPast ? (
                <p className="type-body-medium-tight text-ds-success-300">
                  This event has already occurred.
                </p>
              ) : useMegaYearsCountdownLayout ? (
                <div className="hero-countdown hidden h-fit w-full min-w-0 self-stretch flex-nowrap items-stretch justify-stretch gap-0 md:flex md:h-24 md:w-full md:gap-0 md:justify-start xl:pr-[120px]">
                  <div
                    className="relative flex min-h-0 min-w-0 w-full max-w-full grow basis-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-0 bg-ds-neutral-1000 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-1 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:w-full md:rounded-2xl md:py-2"
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
                <div className="hero-countdown hidden h-fit w-full min-w-0 self-stretch flex-nowrap items-stretch justify-stretch gap-0 md:flex md:h-24 md:w-full md:gap-0 md:justify-start xl:pr-[120px]">
                  <div
                    className="hero-countdown__segments flex min-h-0 min-w-0 flex-1 flex-nowrap divide-x divide-[var(--ds-neutral-800)] overflow-hidden rounded-2xl border-0 shadow-none md:h-full md:min-h-0"
                  >
                    {heroCountdownSegments.map((segment, index) => {
                      const n = heroCountdownSegments.length;
                      const radiusRole: "single" | "first" | "middle" | "last" =
                        n <= 1 ? "single" : index === 0 ? "first" : index === n - 1 ? "last" : "middle";
                      return (
                        <HeroFlipSegment
                          key={segment.label}
                          grouped
                          label={segment.label}
                          radiusRole={radiusRole}
                          valueText={
                            segment.label === "DAYS"
                              ? formatCountdownDaysDisplay(segment.value)
                              : segment.label === "YEARS" && segment.value > 99
                                ? segment.value.toLocaleString("en-US")
                                : segment.value.toString().padStart(2, "0")
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {onExplore ? (
            <div
              className="hero-event__open-hint pointer-events-none absolute right-4 top-4 z-[1] hidden size-10 items-center justify-center rounded-full bg-ds-neutral-1000 md:flex"
              aria-hidden
            >
              <OpenArrowGlyph
                clipId={openArrowClipIdDesktop}
                className="size-[22px] shrink-0 text-ds-neutral-400 transition-colors duration-200 ease-out group-hover:text-ds-text-brand group-focus-within:text-ds-text-brand md:size-6"
              />
            </div>
          ) : null}
        </div>
      </div>

      {sortedEvents.length > 1 ? (
        <div className="flex h-fit min-w-0 w-full max-w-full flex-col gap-2 border-t border-[var(--ds-neutral-800)] bg-ds-neutral-900 px-5 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6">
          <div className="mb-0 flex min-w-0 items-center justify-between gap-3 px-2 md:mb-0">
            <label
              htmlFor="hero-event-time-slider"
              className="block cursor-pointer font-sans text-[18px] font-medium leading-[22px] tracking-[0.02em] text-ds-neutral-00"
            >
              Timeline
            </label>
            <span className="flex shrink-0 items-center gap-2 text-left align-middle">
              <span className="hidden font-departure-mono text-[16px] leading-[20px] text-ds-neutral-300 md:block">
                Year:
              </span>
              <span className="inline-flex min-h-[32px] min-w-[64px] items-center justify-center rounded-xl bg-ds-neutral-1000 px-2.5 py-1.5 md:min-h-[36px] md:min-w-[72px] md:px-3 md:py-1.5">
                {heroTimelineYearDisplay.kind === "mega" ? (
                  <span className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0">
                    <span className="whitespace-nowrap font-departure-mono text-[18px] !font-bold leading-[22px] tracking-[1px] text-ds-neutral-00">
                      {heroTimelineYearDisplay.numberPart}
                    </span>
                    <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.scaleWord}</span>
                  </span>
                ) : showHeroYearVerbalEnd ? (
                  <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.text}</span>
                ) : (
                  <span className="whitespace-nowrap font-departure-mono text-[18px] !font-bold leading-[22px] tracking-[0.03em] text-ds-neutral-00">
                    {heroTimelineYearDisplay.text}
                  </span>
                )}
              </span>
            </span>
          </div>
          <div
            className="hero-event-slider-wrap min-w-0 w-full max-w-full"
            data-at-start={activeIndex === 0 ? "true" : "false"}
            style={{ "--slider-progress": `${sliderProgress}%` } as CSSProperties}
          >
            <div aria-hidden="true" className="hero-event-slider-visual" />
            <div aria-hidden="true" className="hero-event-slider-thumb-visual" />
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
        </div>
      ) : null}
    </section>
  );
}