"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

function RocketIcon({ className }: { className?: string }) {
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
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export type EventCardProps = {
  event: HeroEventData;
  onExplore?: (event: HeroEventData) => void;
};

export default function EventCard({ event, onExplore }: EventCardProps) {
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
      className={`event-card${isInteractive ? " event-card--interactive" : ""}`}
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
      </div>

      <div className="event-card__content w-full">
        <div className="event-card__header">
          <h3 className="event-card__title">{event.title}</h3>
          <p className="event-card__description">{event.shortDescription}</p>
        </div>

        <div className="event-card__content-spacer" aria-hidden />

        <div className="event-card__meta">
          <div className="flex w-full flex-col gap-1 px-12">
            {showCardDateRow ? (
              <div className="event-card__date">
                <div className="event-card__date-cluster">
                  <span className="event-card__date-icon">
                    <img src="/icons/gg_calendar.svg" width="24" height="24" alt="" aria-hidden />
                  </span>
                  <div className="event-card__date-text-row">
                    <span className="event-card__date-day">{formatEventDateOnlyLong(event.date)}</span>
                    {eventHasSpecificUtcTime(event.date) ? (
                      <>
                        <span className="event-card__date-divider" aria-hidden="true" />
                        <span className="event-card__date-time">{formatEventTimeUtcLabel(event.date)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="event-card__countdown">
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
                        <span className="font-sans text-[17px] font-semibold leading-tight text-ds-neutral-00 sm:text-[24px] sm:leading-[24px]">
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

          <button
            type="button"
            className="event-card__explore hidden sm:inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              onExplore?.(event);
            }}
          >
            <span className="event-card__explore-icon">
              <img src="/icons/rocket.svg" width="20" height="20" />
            </span>
            <span className="type-button-label">
              Explore
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

