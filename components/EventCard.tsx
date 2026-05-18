"use client";

import Image from "next/image";
import { useId } from "react";
import {
  eventHasSpecificUtcTime,
  formatCountdownDaysDisplay,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
  formatLongTermCountdownParts,
  formatMegaYearScaleParts,
  getEventCalendarYear,
} from "@/utils/eventDate";
import { useCountdown } from "@/hooks/useCountdown";
import EventTagGroup from "./EventTagGroup";
import type { HeroEventData } from "./HeroEvent";
import { useLocale } from "@/context/LocaleContext";
import OpenArrowGlyph from "./OpenArrowGlyph";

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

export type EventCardProps = {
  event: HeroEventData;
  onExplore?: (event: HeroEventData) => void;
};

const openArrowGlyphClass =
  "size-4 shrink-0 text-ds-neutral-400 transition-colors duration-200 ease-out group-hover:text-ds-neutral-00 group-focus-within:text-ds-neutral-00 md:size-6";

export default function EventCard({ event, onExplore }: EventCardProps) {
  const { locale, t } = useLocale();
  const openArrowClipId = useId().replace(/:/g, "");
  const countdown = useCountdown(event.date);
  const showLongTermYearsOnly = isLongTermEvent(event);
  const longTermCountdown = formatLongTermCountdownParts(countdown.years, locale);
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

  const megaScale = formatMegaYearScaleParts(countdown.years, locale);
  const dateAria = eventHasSpecificUtcTime(event.date)
    ? t("heroEvent.eventDateAndTimeAria")
    : t("heroEvent.eventDateAria");

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
      <div className="event-card__image-wrap max-sm:!h-[180px]">
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
            className="event-card__open-hint event-card__open-hint--on-image pointer-events-none absolute right-2 top-2 z-[11] hidden size-12 items-center justify-center rounded-[16px] bg-ds-neutral-800 md:flex"
            aria-hidden
          >
            <OpenArrowGlyph clipId={openArrowClipId} className={openArrowGlyphClass} />
          </div>
        ) : null}
      </div>

      <div className="event-card__content">
        <div className="event-card__header">
          <div className="event-card__head">
            {showCardDateRow ? (
              <div className="event-card__date">
                <div className="flex h-10 w-full max-w-full justify-center">
                  <div
                    className="hero-event__date-badge inline-flex h-fit max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-[12px] border border-[var(--ds-neutral-800)] bg-[var(--ds-neutral-700)] py-1 pl-1 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50 sm:gap-2.5 sm:pl-1 sm:pr-3 sm:py-1 sm:text-[16px] sm:leading-tight"
                    role="group"
                    aria-label={dateAria}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-ds-neutral-950"
                      aria-hidden
                    >
                      <span
                        className="inline-block h-4 w-4 shrink-0 bg-ds-warning-500 [mask-image:url('/icons/calendar1.svg')] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-image:url('/icons/calendar1.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]"
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 truncate font-sans text-[14px] font-medium sm:text-[16px]">
                      {formatEventDateOnlyLong(event.date, locale)}
                    </span>
                    {eventHasSpecificUtcTime(event.date) ? (
                      <>
                        <span
                          className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500 sm:h-4"
                          aria-hidden="true"
                        />
                        <span className="shrink-0 whitespace-nowrap font-sans text-[14px] font-medium sm:text-[16px]">
                          {formatEventTimeUtcLabel(event.date, locale)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            <h3 className="event-card__title">{event.title}</h3>
          </div>
          <p className="event-card__description">{event.shortDescription}</p>
        </div>

        <div className="event-card__content-spacer" aria-hidden />

        <div className="event-card__meta">
          <div className="event-card__countdown w-full">
              {countdown.isPast ? (
                <p className="event-card__past-message">{t("events.eventInPast")}</p>
              ) : useMegaYearsCountdownLayout ? (
                <div className="event-card__countdown-grid">
                  <div className="event-card__countdown-segment">
                    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center">
                      <span className="event-card__countdown-value event-card__countdown-value--mega text-[28px] leading-[28px] sm:text-[32px] sm:leading-[1.1]">
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
                      {t("countdown.yearsFromNow")}
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
                <div className="event-card__countdown-grid h-[88px]">
                  <div className="event-card__countdown-segment">
                    <span className="event-card__countdown-value text-[28px] leading-[28px] sm:text-[32px] sm:leading-[32px]">
                      {countdown.years.toString().padStart(2, "0")}
                    </span>
                    <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>
                      {t("countdown.years")}
                    </span>
                  </div>
                  {precision !== "year" ? (
                    <div className="event-card__countdown-segment">
                      <span className="event-card__countdown-value text-[28px] leading-[28px] sm:text-[32px] sm:leading-[32px]">
                        {formatCountdownDaysDisplay(countdown.days)}
                      </span>
                      <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>
                        {t("countdown.days")}
                      </span>
                    </div>
                  ) : null}
                  {precision !== "year" ? (
                    <div className="event-card__countdown-segment">
                      <span className="event-card__countdown-value text-[28px] leading-[28px] sm:text-[32px] sm:leading-[32px]">
                        {(precision === "day" ? 0 : countdown.hours).toString().padStart(2, "0")}
                      </span>
                      <span className={EVENT_CARD_COUNTDOWN_LABEL_CLASS}>
                        {t("countdown.hours")}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
    </article>
  );
}

