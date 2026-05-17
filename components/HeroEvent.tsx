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
  formatCountdownDaysDisplay,
  formatLongTermCountdownParts,
  formatMegaYearScaleParts,
  getHeroTimelineYearDisplay,
  heroEndOfTimeLabel,
  getApproxYearsRemaining,
  getEventCalendarYear,
  isEventOnOrAfterNow,
} from "@/utils/eventDate";
import { useCountdown } from "@/hooks/useCountdown";
import EventDateBadge from "./EventDateBadge";
import EventTagGroup, { type EventExtraTag } from "./EventTagGroup";
import OpenArrowGlyph from "./OpenArrowGlyph";
import { useLocale } from "@/context/LocaleContext";
import { intlLocaleFor } from "@/lib/i18n";

export type CountdownPrecision = "full" | "day" | "year";

export type EventRarity = 1 | 2 | 3 | 4 | 5;

export type HeroEventData = {
  id: string;
  title: string;
  date: string;
  /** Observational / “once in a lifetime” scale, 1 = more common, 5 = extremely rare. */
  rarity: EventRarity;
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

type CountdownSegmentId = "years" | "days" | "hours";

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
      className={`hero-flip-segment relative flex min-w-0 min-h-0 w-full flex-1 basis-0 select-none flex-col items-center justify-center gap-[8px] overflow-hidden border-0 bg-ds-neutral-1000 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-2 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:py-3 ${radiusClass}`}
      aria-label={`${label}: ${valueText}`}
    >
      <span className="event-card__countdown-value text-center text-[20px] leading-[20px] tabular-nums sm:text-[30px] sm:leading-none md:text-[34px] lg:text-[40px] lg:leading-[40px]">
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
  const { locale, t } = useLocale();
  const endOfTimeLabel = heroEndOfTimeLabel(locale);
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
  const longTermCountdown = formatLongTermCountdownParts(yearsRemaining, locale);
  const normalizedYears = countdown.years;
  const normalizedDays = countdown.days;
  const precision = liveEvent.countdownPrecision ?? "full";
  const displayPrecision = displayEvent.countdownPrecision ?? "full";
  /** Extra vertical room when the hero shows a single YEARS segment (long titles can overlap the countdown). */
  const heroYearOnlyExtraHeight = displayPrecision === "year";
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
  const megaScale = formatMegaYearScaleParts(countdown.years, locale);
  const heroCountdownSegments: { id: CountdownSegmentId; value: number }[] =
    precision === "year"
      ? [{ id: "years", value: normalizedYears }]
      : precision === "day"
        ? [
            { id: "years", value: normalizedYears },
            { id: "days", value: normalizedDays },
            { id: "hours", value: 0 },
          ]
        : [
            { id: "years", value: normalizedYears },
            { id: "days", value: normalizedDays },
            { id: "hours", value: countdown.hours },
          ];
  const sliderProgress =
    sortedEvents.length > 1 ? (activeIndex / (sortedEvents.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!liveEvent) return;
    onActiveEventChange?.(liveEvent);
  }, [liveEvent, onActiveEventChange]);

  if (!displayEvent || !liveEvent) return null;

  const atTimelineEnd =
    sortedEvents.length > 0 && activeIndex === sortedEvents.length - 1;
  const heroTimelineYearDisplay = atTimelineEnd
    ? ({ kind: "plain" as const, text: endOfTimeLabel })
    : getHeroTimelineYearDisplay(liveEvent.date, locale);
  const showHeroYearVerbalEnd =
    atTimelineEnd ||
    (heroTimelineYearDisplay.kind === "plain" &&
      heroTimelineYearDisplay.text === endOfTimeLabel);

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
    <section className="relative flex h-fit w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden rounded-3xl">
      <div
        role={onExplore ? "button" : undefined}
        tabIndex={onExplore ? 0 : undefined}
        onClick={onExplore ? handleHeroMainAreaClick : undefined}
        onKeyDown={onExplore ? handleHeroMainAreaKeyDown : undefined}
        className={`grid h-fit min-w-0 w-full gap-x-0 gap-y-[8px] border-[1px] border-solid border-[rgba(31,41,55,0.8)] [border-image:none] rounded-3xl bg-[var(--app-card-surface)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] md:h-fit md:grid-cols-[240px_minmax(0,1fr)] md:gap-x-2 lg:grid-cols-[400px_minmax(0,1fr)] ${
          onExplore ? "hero-event--interactive group cursor-pointer" : ""
        } ${
          isVisible
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-0 -translate-y-0.5 blur-[1.5px]"
        }`}
      >
        {/* Left: visual */}
        <div
          className={`hero-event__image-wrap relative max-md:m-1 max-md:w-[calc(100%-0.5rem)] md:mt-1 md:mb-1 md:ml-1 md:mr-0 md:w-full h-[192px] min-h-[192px] min-w-0 max-w-full overflow-hidden rounded-3xl ${
            heroPanelCompact
              ? heroYearOnlyExtraHeight
                ? "md:h-[304px] md:min-h-[304px]"
                : "md:h-[280px] md:min-h-[280px]"
              : heroYearOnlyExtraHeight
                ? "md:h-[364px] md:min-h-[364px]"
                : "md:h-[340px] md:min-h-[340px]"
          }`}
        >
          <Image
            src={displayEvent.image}
            alt={displayEvent.title}
            fill
            priority
            sizes="(min-width: 1024px) 400px, (min-width: 768px) 240px, 100vw"
            className="hero-event__image object-cover"
          />

          <EventTagGroup
            primaryTag={displayEvent.tags?.[0]}
            specialTags={displayEvent.specialTags}
          />

        </div>

        {/* Right: information */}
        <div
          className={`relative flex h-full w-full min-h-0 min-w-0 max-w-full flex-col rounded-t-none rounded-b-3xl bg-[var(--app-card-surface)] px-6 pb-6 pt-6 text-center md:rounded-l-none md:rounded-tr-3xl md:rounded-br-3xl md:pl-10 md:pr-20 md:pb-10 md:pt-8 md:text-left ${
            heroPanelCompact
              ? heroYearOnlyExtraHeight
                ? "max-md:min-h-[232px]"
                : "max-md:min-h-[208px]"
              : heroYearOnlyExtraHeight
                ? "max-md:min-h-[240px]"
                : "max-md:min-h-[264px]"
          }`}
        >
          <div
            className={`flex w-full min-w-0 shrink-0 flex-col items-center gap-2 md:items-stretch ${showHeroDateRow ? "mb-3" : "mb-3 md:mb-0"}`}
          >
            {showHeroDateRow ? (
              <div className="flex h-fit w-full max-w-full items-center justify-center md:mr-5 md:w-fit md:justify-start">
                <EventDateBadge date={displayEvent.date} />
              </div>
            ) : null}

            {!showHeroDateRow ? (
              <div className="flex w-full max-w-full justify-center md:hidden">
                <EventDateBadge date={displayEvent.date} />
              </div>
            ) : null}
          </div>

          <div className="-mb-8 flex w-full min-w-0 shrink-0 flex-col items-center gap-1 md:items-start md:gap-1">
            <h3 className="m-0 max-w-full break-words font-sans font-semibold text-ds-neutral-50 text-[20px] leading-[25px] sm:text-[24px] sm:leading-[32px] md:leading-[32px] md:line-clamp-3 md:font-medium">
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

          {/* Countdown: flex-1 spacer fills extra min-height */}
          <div className="flex w-full min-w-0 shrink-0 flex-col items-center gap-2 pt-0 md:items-stretch">
            <div className="hero-event__date-countdown flex w-full min-w-0 flex-col items-center gap-2 md:items-stretch">
              {countdown.isPast ? (
                <p className="type-body-medium-tight text-ds-success-300">
                  {t("heroEvent.eventAlreadyOccurred")}
                </p>
              ) : useMegaYearsCountdownLayout ? (
                <div className="hero-countdown hidden h-fit w-full min-w-0 max-w-full self-stretch flex-nowrap items-stretch justify-stretch gap-0 md:flex md:h-[104px] md:w-full md:gap-0 md:justify-start md:pr-20">
                  <div
                    className="relative flex min-h-0 min-w-0 w-full max-w-full grow basis-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-0 bg-ds-neutral-1000 px-2 py-3 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)] sm:h-full sm:min-h-[92px] sm:gap-1 sm:px-2.5 sm:py-3.5 md:h-full md:min-h-0 md:w-full md:rounded-2xl md:py-2"
                    aria-label={t("countdown.yearsFromNowAria", {
                      value: `${megaScale.numberPart}${megaScale.scaleWord ? ` ${megaScale.scaleWord}` : ""}`,
                    })}
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
                      {t("countdown.yearsFromNow")}
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
                <div className="hero-countdown hidden h-fit w-full min-w-0 max-w-full self-stretch flex-nowrap items-stretch justify-stretch gap-0 md:flex md:h-[96px] md:w-full md:gap-0 md:justify-start min-[1400px]:pr-20">
                  <div
                    className="hero-countdown__segments flex w-full min-h-0 min-w-0 max-w-full flex-1 flex-nowrap divide-x divide-[var(--ds-neutral-800)] overflow-hidden rounded-2xl border-0 md:h-[96px] md:min-h-0"
                  >
                    {heroCountdownSegments.map((segment, index) => {
                      const n = heroCountdownSegments.length;
                      const radiusRole: "single" | "first" | "middle" | "last" =
                        n <= 1 ? "single" : index === 0 ? "first" : index === n - 1 ? "last" : "middle";
                      return (
                        <HeroFlipSegment
                          key={segment.id}
                          grouped
                          label={t(`countdown.${segment.id}`)}
                          radiusRole={radiusRole}
                          valueText={
                            segment.id === "days"
                              ? formatCountdownDaysDisplay(segment.value)
                              : segment.id === "years" && segment.value > 99
                                ? segment.value.toLocaleString(intlLocaleFor(locale))
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
              className="hero-event__open-hint pointer-events-none absolute right-[var(--ds-spacing-2xs)] top-[var(--ds-spacing-2xs)] z-[1] hidden size-16 items-center justify-center rounded-[24px] bg-ds-neutral-700 md:flex"
              aria-hidden
            >
              <OpenArrowGlyph
                clipId={openArrowClipIdDesktop}
                className="size-[22px] shrink-0 text-ds-neutral-400 transition-colors duration-200 ease-out group-hover:text-ds-neutral-00 group-focus-within:text-ds-neutral-00 md:size-6"
              />
            </div>
          ) : null}

        </div>
      </div>

      {sortedEvents.length > 1 ? (
        <div className="flex h-fit min-w-0 w-full max-w-full flex-col gap-1.5 rounded-3xl border-t border-[var(--ds-neutral-700)] bg-[var(--app-card-surface)] px-5 pb-6 pt-5 md:gap-1 md:px-6 md:pb-6 md:pt-4">
          <div className="mb-0 flex min-w-0 items-center justify-between gap-3 px-0 md:mb-0">
            <label
              htmlFor="hero-event-time-slider"
              className="block cursor-pointer font-sans text-[16px] font-medium leading-[20px] tracking-[0.02em] text-ds-neutral-00 md:text-[18px] md:leading-[22px]"
            >
              {t("heroEvent.timeline")}
            </label>
            <span className="flex shrink-0 items-center gap-2 text-left align-middle">
              <span className="hidden font-sans text-[16px] leading-[20px] text-ds-neutral-300 md:block">
                {t("heroEvent.year")}
              </span>
              <span className="inline-flex min-h-[32px] min-w-[64px] items-center justify-center rounded-xl bg-ds-neutral-1000 px-2.5 py-2 md:min-h-[36px] md:min-w-[72px] md:px-3 md:py-2">
                {heroTimelineYearDisplay.kind === "mega" ? (
                  <span className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0">
                    <span className="whitespace-nowrap font-departure-mono text-[18px] !font-bold leading-[22px] tracking-[1px] text-ds-neutral-00 md:text-[20px] md:leading-[24px]">
                      {heroTimelineYearDisplay.numberPart}
                    </span>
                    <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.scaleWord}</span>
                  </span>
                ) : showHeroYearVerbalEnd ? (
                  <span className={heroTimelineLabelFont}>{heroTimelineYearDisplay.text}</span>
                ) : (
                  <span className="whitespace-nowrap font-departure-mono text-[18px] !font-bold leading-[22px] tracking-[0.03em] text-ds-neutral-00 md:text-[20px] md:leading-[24px]">
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
              onChange={(e) => {
                setActiveIndex(Number(e.currentTarget.value));
              }}
              aria-label={t("heroEvent.timelineSlider")}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}