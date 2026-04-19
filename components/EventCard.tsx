"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import {
  eventHasSpecificUtcTime,
  formatCountdownDaysDisplay,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
  formatMegaYearScaleParts,
  getCountdownBreakdown,
  getEventCalendarYear,
} from "@/utils/eventDate";
import EventTagGroup from "./EventTagGroup";
import type { HeroEventData } from "./HeroEvent";
import OpenArrowGlyph from "./OpenArrowGlyph";

type Countdown = {
  years: number;
  days: number;
  hours: number;
  isPast: boolean;
};

const LONG_TERM_SECTIONS = new Set([
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
]);

const HIDE_CARD_DATE_SECTIONS = new Set([
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
]);

/** Mobile-first: 12px; sm+ 14/16. Letter-spacing stays normal (0) at all breakpoints. */
const EVENT_CARD_COUNTDOWN_LABEL_CLASS =
  "event-card__countdown-label text-[12px] leading-[14px] tracking-normal sm:text-[14px] sm:leading-[16px]";

function useCountdown(targetDate: string): Countdown {
  const getDiff = (): Countdown => {
    const b = getCountdownBreakdown(targetDate);
    return {
      years: b.years,
      days: b.days,
      hours: b.hours,
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

export type EventCardProps = {
  event: HeroEventData;
  onExplore?: (event: HeroEventData) => void;
};

const openArrowGlyphClass =
  "size-4 shrink-0 text-ds-neutral-400 transition-colors duration-200 ease-out group-hover:text-ds-text-brand group-focus-within:text-ds-text-brand md:size-6";

export default function EventCard({ event, onExplore }: EventCardProps) {
  const openArrowClipId = useId().replace(/:/g, "");
  const countdown = useCountdown(event.date);
  const showLongTermYearsOnly = isLongTermEvent(event);
  const longTermCountdown = formatLongTermYears(countdown.years);
  const isInteractive = Boolean(onExplore);
  const precision = event.countdownPrecision ?? "full";
  /** Same countdown chrome as Millions/Billions: big number + “years from now”. */
  const useMegaYearsCountdownLayout =
    event.timeCategory === "Next 10,000 Years" ||
    event.timeCategory === "Millions of Years" ||
    event.timeCategory === "Billions of Years";

  /** Long-range pill (not used for mega-layout categories). */
  const useBigLongTermCountdown =
    showLongTermYearsOnly && !useMegaYearsCountdownLayout;

  const megaScale = formatMegaYearScaleParts(countdown.years);

  const showCardDateRow =
    !event.timeCategory || !HIDE_CARD_DATE_SECTIONS.has(event.timeCategory);

  return (
    <article
      className={`event-card${isInteractive ? " event-card--interactive group" : ""}`}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? () => onExplore?.(event) : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onExplore?.(event);
              }
            }
          : undefined
      }
    >
      <div className="event-card__image-wrap">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="event-card__image"
        />
        <EventTagGroup primaryTag={event.tags?.[0]} specialTags={event.specialTags} />

        {isInteractive ? (
          <div
            className="event-card__open-hint event-card__open-hint--on-image pointer-events-none absolute right-4 top-4 z-[11] hidden size-[34px] items-center justify-center rounded-full bg-ds-neutral-900 md:flex md:size-10"
            aria-hidden
          >
            <OpenArrowGlyph clipId={openArrowClipId} className={openArrowGlyphClass} />
          </div>
        ) : null}
      </div>

      <div className="event-card__content">
        <div className="event-card__header">
          <h3 className="event-card__title">{event.title}</h3>
          <p className="event-card__description">{event.shortDescription}</p>
        </div>

        <div className="event-card__content-spacer" aria-hidden />

        <div className="event-card__meta">
          <div className="flex w-full flex-col gap-2 sm:px-6 md:px-0 xl:px-6">
            {showCardDateRow ? (
              <div className="event-card__date">
                <div className="flex h-10 w-fit max-w-full justify-center">
                  <div
                    className="hero-event__date-badge inline-flex h-10 max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-lg border border-[var(--ds-neutral-800)] bg-ds-neutral-850 py-1 pl-3 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50 sm:gap-2.5 sm:pl-3 sm:pr-3 sm:py-1 sm:text-[16px] sm:leading-tight"
                    role="group"
                    aria-label={`Event date${eventHasSpecificUtcTime(event.date) ? " and time" : ""}`}
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
                      {formatEventDateOnlyLong(event.date)}
                    </span>
                    {eventHasSpecificUtcTime(event.date) ? (
                      <>
                        <span
                          className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500 sm:h-4"
                          aria-hidden="true"
                        />
                        <span className="shrink-0 whitespace-nowrap font-sans">
                          {formatEventTimeUtcLabel(event.date)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="event-card__countdown w-full">
              {countdown.isPast ? (
                <p className="event-card__past-message">Event in the past</p>
              ) : useMegaYearsCountdownLayout ? (
                <div className="event-card__countdown-grid">
                  <div className="event-card__countdown-segment">
                    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center">
                      <span className="event-card__countdown-value event-card__countdown-value--mega text-[20px] leading-[1.15] sm:text-[32px] sm:leading-[1.1]">
                        {megaScale.numberPart}
                      </span>
                      {megaScale.scaleWord ? (
                        <span className="font-sans font-semibold tracking-normal text-[17px] leading-tight text-ds-neutral-00 sm:text-[24px] sm:leading-[24px]">
                          {megaScale.scaleWord}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`${EVENT_CARD_COUNTDOWN_LABEL_CLASS} event-card__countdown-label--from-now`}
                    >
                      years from now
                    </span>
                  </div>
                </div>
              ) : useBigLongTermCountdown ? (
                <div className="flex w-full items-center justify-center rounded-xl border border-[var(--ds-neutral-800)] bg-ds-neutral-1000 px-4 py-3 sm:py-3.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-[38px] leading-[38px] font-normal tabular-nums text-ds-neutral-100">
                      {longTermCountdown.value}
                    </span>
                    <span className="font-sans text-[24px] leading-[38px] font-normal text-ds-neutral-500">
                      {longTermCountdown.unit}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="event-card__countdown-grid">
                  <div className="event-card__countdown-segment">
                    <span className="event-card__countdown-value text-[20px] leading-[20px] sm:text-[24px] sm:leading-[24px]">
                      {countdown.years.toString().padStart(2, "0")}
                    </span>
                    <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>YEARS</span>
                  </div>
                  {precision !== "year" ? (
                    <div className="event-card__countdown-segment">
                      <span className="event-card__countdown-value text-[20px] leading-[20px] sm:text-[24px] sm:leading-[24px]">
                        {formatCountdownDaysDisplay(countdown.days)}
                      </span>
                      <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>DAYS</span>
                    </div>
                  ) : null}
                  {precision === "full" ? (
                    <div className="event-card__countdown-segment">
                      <span className="event-card__countdown-value text-[20px] leading-[20px] sm:text-[24px] sm:leading-[24px]">
                        {countdown.hours.toString().padStart(2, "0")}
                      </span>
                      <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>HRS</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

