"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import BrandLogo from "@/components/BrandLogo";
import CosmosHero from "@/components/CosmosHero";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";
import EventDetailsModal from "@/components/EventDetailsModal";
import { getEventsForLocale } from "@/data/events";
import {
  captureScrollPositionForModal,
  lockBodyScroll,
  syncScrollSnapshot,
} from "@/lib/bodyScrollLock";
import { compareEventDateStrings } from "@/utils/eventDate";
import {
  getTimeRangeSection,
  groupEventsByTimeSection,
} from "@/utils/eventSections";
import { useLocale } from "@/context/LocaleContext";

const BUY_ME_A_COFFEE_URL =
  process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL ??
  "https://buymeacoffee.com/dmitri.pushkarev";

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function deriveWhyItMatters(mainDescription: string) {
  const sentences = splitSentences(mainDescription);
  const why = sentences.slice(0, 2).join(" ");
  return why || mainDescription;
}

function deriveWhatYoullSee(mainDescription: string) {
  const sentences = splitSentences(mainDescription);
  const part = sentences.slice(2, 5).join(" ");

  // Fallback: if the explanation is short, use the last sentences.
  return part || sentences.slice(-2).join(" ") || mainDescription;
}

function deriveKeyFacts(mainDescription: string) {
  const sentences = splitSentences(mainDescription);
  const candidates = [
    ...sentences.slice(0, 2),
    ...(sentences.length ? [sentences[sentences.length - 1]] : []),
  ].filter(Boolean);

  const unique: string[] = [];
  for (const c of candidates) {
    const normalized = c.replace(/\s+/g, " ").trim();
    if (normalized && !unique.includes(normalized)) unique.push(normalized);
  }

  const base = unique.length
    ? unique
    : sentences.slice(0, Math.min(4, sentences.length));

  // Ensure 2-4 bullets for the modal.
  const result = base.slice(0, 4);
  while (result.length < 2) {
    result.push(
      "Visibility and exact appearance can vary based on location and observing conditions."
    );
  }

  return result;
}

/** Cards shown initially and appended per scroll batch. */
const EVENTS_BATCH_SIZE = 10;
const TIME_RANGE_OPTIONS = [
  "Next 100 Years",
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
] as const;
type TimeRangeOption = (typeof TIME_RANGE_OPTIONS)[number];
type FilterDropdown = "time" | "tag" | null;

function useIsNarrowMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(max-width: 639px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false
  );
}
const EVENT_TAGS: Record<string, string> = {
  "venus-jupiter-great-conjunction-2026": "Conjunction",
  "greatest-solar-eclipse-europe-2026": "Eclipse",
  "apophis-close-flyby-2029": "Asteroid",
  "taurid-meteor-swarm-2032": "Meteor Shower",
  "blood-moon-tetrad-2032-2033": "Eclipse",
  "great-planetary-alignment-2034": "Planetary Event",
  "great-mars-opposition-2035": "Planetary Event",
  "extreme-supermoon-2037": "Lunar Event",
  "saturn-ring-plane-crossing-2038": "Planetary Event",
  "greatest-solar-eclipse-north-america-2045": "Eclipse",
  "brightest-jupiter-2056": "Planetary Event",
  "halleys-comet-2061": "Comet",
  "greatest-solar-eclipse-europe-2081": "Eclipse",
  "uranus-neptune-conjunction-2093": "Planetary Event",
  "transit-of-venus-2117": "Transit",
  "second-transit-of-venus-2125": "Transit",
  "annular-solar-eclipse-2126": "Eclipse",
  "comet-swift-tuttle-2126": "Comet",
};

function buildEventsSeed(base: HeroEventData[]): HeroEventData[] {
  return base.map((event) => ({
    ...event,
    timeCategory:
      event.timeCategory ??
      (getTimeRangeSection(event) as HeroEventData["timeCategory"]),
    tags: event.tags?.length ? event.tags : [EVENT_TAGS[event.id] ?? "Solar system"],
    // Allow content in `data/events/*.json` (merged via `data/events/index.ts`) to override auto-generated fields.
    // If a field is missing (`undefined`), we fall back to derived content.
    whyItMatters:
      event.whyItMatters ?? deriveWhyItMatters(event.mainDescription),
    whatYoullSee:
      event.whatYoullSee ?? deriveWhatYoullSee(event.mainDescription),
    keyFacts: event.keyFacts ?? deriveKeyFacts(event.mainDescription),
  }));
}

export default function Home() {
  const { locale, t, timeRangeLabel } = useLocale();

  const eventsSeed = useMemo(
    () =>
      buildEventsSeed(getEventsForLocale(locale) as unknown as HeroEventData[]),
    [locale]
  );
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    TimeRangeOption | "all"
  >("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<FilterDropdown>(null);
  const [visibleCount, setVisibleCount] = useState(EVENTS_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEventData | null>(
    null
  );
  const [heroActiveEventId, setHeroActiveEventId] = useState<string | null>(null);
  const [mobileGridSectionsVisible, setMobileGridSectionsVisible] = useState(1);
  const isNarrowMobile = useIsNarrowMobile();
  const isFetchingRef = useRef(false);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const stickyToolbarSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isStickyFilterBarPinned, setIsStickyFilterBarPinned] = useState(false);
  const [isMobileToolbarVisible, setIsMobileToolbarVisible] = useState(true);
  const selectedEventRef = useRef<HeroEventData | null>(null);
  const prevSelectedEventRef = useRef<HeroEventData | null>(null);
  const prevSelectedEventForLayoutRef = useRef<HeroEventData | null>(null);
  const mobileToolbarVisibleBeforeModalRef = useRef<boolean | null>(null);
  const suppressToolbarScrollUntilRef = useRef(0);
  const mobileGridSentinelRef = useRef<HTMLDivElement | null>(null);
  const mobileGridSectionsVisibleRef = useRef(1);
  const maxTimeSectionsRef = useRef(0);
  const hasMoreEventsRef = useRef(false);
  const loadMoreEventsRef = useRef<() => void>(() => {});

  const sortedEvents = useMemo(
    () =>
      [...eventsSeed].sort((a, b) => compareEventDateStrings(a.date, b.date)),
    [eventsSeed]
  );

  useEffect(() => {
    setVisibleCount(EVENTS_BATCH_SIZE);
    setIsLoadingMore(false);
    isFetchingRef.current = false;
    setHeroActiveEventId(null);
    setSelectedTags([]);
    setSelectedTimeRange("all");
    setMobileGridSectionsVisible(1);
  }, [locale]);
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const event of sortedEvents) {
      for (const tag of event.tags ?? []) tags.add(tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [sortedEvents]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      const matchesTimeRange =
        selectedTimeRange === "all" ||
        getTimeRangeSection(event) === selectedTimeRange;
      const matchesTag =
        selectedTags.length === 0 ||
        (event.tags ? event.tags.some((tag) => selectedTags.includes(tag)) : false);
      return matchesTimeRange && matchesTag;
    });
  }, [selectedTags, selectedTimeRange, sortedEvents]);

  const clampedVisibleCount = Math.min(visibleCount, filteredEvents.length);
  const visibleEvents = filteredEvents.slice(0, clampedVisibleCount);
  const hasMoreEvents = clampedVisibleCount < filteredEvents.length;
  const heroEvents = filteredEvents;

  const nextEvent = heroEvents[0];
  const activeHeroEventId =
    heroActiveEventId && heroEvents.some((event) => event.id === heroActiveEventId)
      ? heroActiveEventId
      : nextEvent?.id ?? null;
  const remainingEvents = visibleEvents.filter(
    (event) => event.id !== activeHeroEventId
  );

  const timeSectionGroups = useMemo(
    () => groupEventsByTimeSection(remainingEvents),
    [remainingEvents]
  );

  const eventsForEventGrid = useMemo(() => {
    if (!isNarrowMobile || viewMode !== "grid") return remainingEvents;
    return timeSectionGroups
      .slice(0, mobileGridSectionsVisible)
      .flatMap((group) => group.events);
  }, [
    isNarrowMobile,
    mobileGridSectionsVisible,
    remainingEvents,
    timeSectionGroups,
    viewMode,
  ]);

  const loadMoreEvents = useCallback(() => {
    if (isFetchingRef.current || !hasMoreEvents) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    window.setTimeout(() => {
      setVisibleCount((count) =>
        Math.min(count + EVENTS_BATCH_SIZE, filteredEvents.length)
      );
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }, 300);
  }, [filteredEvents.length, hasMoreEvents]);

  loadMoreEventsRef.current = loadMoreEvents;

  useEffect(() => {
    mobileGridSectionsVisibleRef.current = mobileGridSectionsVisible;
  }, [mobileGridSectionsVisible]);

  useEffect(() => {
    maxTimeSectionsRef.current = timeSectionGroups.length;
  }, [timeSectionGroups.length]);

  useEffect(() => {
    hasMoreEventsRef.current = hasMoreEvents;
  }, [hasMoreEvents]);

  useEffect(() => {
    setVisibleCount(EVENTS_BATCH_SIZE);
    setIsLoadingMore(false);
    isFetchingRef.current = false;
    setMobileGridSectionsVisible(1);
  }, [selectedTags, selectedTimeRange]);

  const loadMoreSentinelActive =
    hasMoreEvents ||
    (isNarrowMobile &&
      viewMode === "grid" &&
      mobileGridSectionsVisible < timeSectionGroups.length);

  useEffect(() => {
    if (!loadMoreSentinelActive) return;
    const el = mobileGridSentinelRef.current;
    if (!el) return;

    let canTrigger = false;

    const enableTrigger = () => {
      canTrigger = true;
    };
    window.addEventListener("scroll", enableTrigger, { passive: true, once: true });

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (!entry.isIntersecting) {
          canTrigger = true;
          return;
        }

        if (!canTrigger) return;
        canTrigger = false;

        if (isNarrowMobile && viewMode === "grid") {
          const maxS = maxTimeSectionsRef.current;
          const v = mobileGridSectionsVisibleRef.current;
          if (v < maxS) {
            setMobileGridSectionsVisible(Math.min(v + 1, maxS));
            return;
          }
        }

        if (hasMoreEventsRef.current) {
          loadMoreEventsRef.current();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => {
      window.removeEventListener("scroll", enableTrigger);
      obs.disconnect();
    };
  }, [isNarrowMobile, loadMoreSentinelActive, viewMode]);

  useEffect(() => {
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (!filterPopoverRef.current) return;
      const target = event.target as Node | null;
      if (target && !filterPopoverRef.current.contains(target)) {
        setIsFilterOpen(false);
        setOpenDropdown(null);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isFilterOpen]);

  selectedEventRef.current = selectedEvent;

  useEffect(() => {
    if (!isNarrowMobile) return;

    const wasOpen = prevSelectedEventRef.current !== null;
    const isOpen = selectedEvent !== null;
    prevSelectedEventRef.current = selectedEvent;

    if (isOpen && !wasOpen) {
      mobileToolbarVisibleBeforeModalRef.current = isMobileToolbarVisible;
      setIsMobileToolbarVisible(false);
      setIsFilterOpen(false);
      setOpenDropdown(null);
    }
  }, [selectedEvent, isNarrowMobile, isMobileToolbarVisible]);

  // Restore toolbar in the same pre-paint pass as scroll unlock to avoid a visible flash.
  useLayoutEffect(() => {
    if (!isNarrowMobile) return;

    const wasOpen = prevSelectedEventForLayoutRef.current !== null;
    const isOpen = selectedEvent !== null;
    prevSelectedEventForLayoutRef.current = selectedEvent;

    if (!isOpen && wasOpen && mobileToolbarVisibleBeforeModalRef.current !== null) {
      const restoreVisible = mobileToolbarVisibleBeforeModalRef.current;
      mobileToolbarVisibleBeforeModalRef.current = null;
      suppressToolbarScrollUntilRef.current = performance.now() + 800;
      syncScrollSnapshot();

      const sentinel = stickyToolbarSentinelRef.current;
      if (sentinel) {
        setIsStickyFilterBarPinned(sentinel.getBoundingClientRect().top < 0);
      }
      setIsMobileToolbarVisible(restoreVisible);
    }
  }, [selectedEvent, isNarrowMobile]);

  useEffect(() => {
    if (!isNarrowMobile) {
      setIsStickyFilterBarPinned(false);
      setIsMobileToolbarVisible(true);
      return;
    }
    const sentinel = stickyToolbarSentinelRef.current;
    if (!sentinel) return;

    let lastScrollY = window.scrollY;
    const scrollDeltaThreshold = 6;
    const topRevealThreshold = 12;

    const onScroll = () => {
      if (!selectedEventRef.current) {
        syncScrollSnapshot();
      }

      const scrollY = window.scrollY;
      const { top } = sentinel.getBoundingClientRect();
      const pinned = top < 0;
      setIsStickyFilterBarPinned(pinned);

      if (selectedEventRef.current) return;

      if (performance.now() < suppressToolbarScrollUntilRef.current) {
        return;
      }

      // Keep filters visible until the user scrolls past the filter block (sentinel
      // leaves the viewport). Only then apply hide-on-scroll-down / show-on-scroll-up.
      if (scrollY <= topRevealThreshold || !pinned) {
        setIsMobileToolbarVisible(true);
      } else if (scrollY - lastScrollY > scrollDeltaThreshold) {
        setIsMobileToolbarVisible(false);
        setIsFilterOpen(false);
        setOpenDropdown(null);
      } else if (lastScrollY - scrollY > scrollDeltaThreshold) {
        setIsMobileToolbarVisible(true);
      }

      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isNarrowMobile]);

  const handleDropdownKeyboard = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    dropdown: Exclude<FilterDropdown, null>
  ) => {
    if (event.key === "Escape") {
      setOpenDropdown(null);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenDropdown((current) => (current === dropdown ? null : dropdown));
    }
  };

  const selectedTimeRangeLabel =
    selectedTimeRange === "all"
      ? t("events.allRanges")
      : timeRangeLabel(selectedTimeRange);
  const selectedTagLabel =
    selectedTags.length === 0
      ? t("events.allTags")
      : selectedTags.length === 1
        ? selectedTags[0]
        : t("events.tagsSelected", { count: selectedTags.length });
  const hasActiveFilters =
    selectedTimeRange !== "all" || selectedTags.length > 0;

  const openEventDetails = useCallback((event: HeroEventData) => {
    captureScrollPositionForModal();
    setSelectedEvent(event);
  }, []);

  const isEventModalOpen = selectedEvent !== null;

  // Unlock in useLayoutEffect so scroll is restored before the browser paints without the modal.
  useLayoutEffect(() => {
    if (!isEventModalOpen) return;
    return lockBodyScroll();
  }, [isEventModalOpen]);

  return (
    <div className="min-h-screen overflow-x-clip bg-ds-neutral-1000 px-0 text-ds-neutral-100">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-ds-neutral-1000" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_55%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.3),_transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.28),_transparent_60%)]" />

      <CosmosHero onLogoClick={() => window.location.reload()} />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-14 max-sm:pt-20 sm:px-6 sm:pt-10 lg:px-16 lg:pt-[102px] xl:max-w-[min(84rem,calc(100vw-6rem))]">
        {/* View toggle */}
        {/* Mobile: h2 is a direct child of main (scrolls). Toolbar row is the next sibling with sticky — nested sticky inside flex-col was unreliable in browsers. */}
        <div className="max-sm:-mx-6 max-sm:px-6 sm:hidden">
          <div className="w-full min-w-0 text-left">
            <h2 className="w-full text-left font-sans text-[28px] leading-tight text-ds-neutral-00">
              {t("events.headingPart1")}{" "}
              <span
                className="font-dynamite"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t("events.headingPart2")}
              </span>
            </h2>
          </div>
        </div>

        <div
          ref={stickyToolbarSentinelRef}
          aria-hidden
          className="pointer-events-none max-sm:block max-sm:h-0 max-sm:w-full max-sm:shrink-0 sm:hidden"
        />

        <div
          ref={filterPopoverRef}
          className={[
            "relative mb-9 flex flex-col gap-0 max-sm:-mx-6 max-sm:border-b max-sm:bg-ds-neutral-1000 max-sm:px-6 max-sm:pb-4 max-sm:pt-4 max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:transition-[transform,opacity] max-sm:duration-300 max-sm:ease-out",
            selectedEvent || !isMobileToolbarVisible
              ? "max-sm:pointer-events-none max-sm:-translate-y-full max-sm:opacity-0"
              : "max-sm:translate-y-0 max-sm:opacity-100",
            isStickyFilterBarPinned
              ? "max-sm:border-ds-neutral-800"
              : "max-sm:border-transparent",
            "sm:mx-0 sm:mb-5 sm:flex sm:w-full sm:flex-row sm:items-center sm:justify-between sm:border-b-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:static sm:top-auto sm:gap-4 lg:gap-6",
          ].join(" ")}
        >
          <div className="hidden min-w-0 flex-1 text-left sm:block">
            <h2 className="w-full text-left font-sans text-[28px] leading-tight text-ds-neutral-00 sm:text-[40px] sm:leading-[48px]">
              {t("events.headingPart1")}{" "}
              <span
                className="font-dynamite"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t("events.headingPart2")}
              </span>
            </h2>
          </div>

          <div className="relative flex w-full shrink-0 flex-row-reverse items-center justify-between gap-8 sm:w-auto sm:gap-3 sm:flex-row sm:justify-end lg:gap-4">
            <button
              type="button"
              onClick={() =>
                setIsFilterOpen((open) => {
                  const next = !open;
                  if (!next) setOpenDropdown(null);
                  return next;
                })
              }
              className={[
                "flex shrink-0 cursor-pointer items-center justify-center transition-colors",
                /* Mobile: match ViewToggle outer box — p-1 + h-12 inner → 56px (3.5rem) square */
                "max-sm:size-14 rounded-xl bg-ds-neutral-800",
                "sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:!bg-transparent sm:px-3 sm:py-2",
                "text-base font-bold",
                isFilterOpen
                  ? [
                      "max-sm:bg-ds-neutral-700",
                      hasActiveFilters
                        ? "max-sm:text-ds-primary-400 max-sm:hover:text-ds-primary-300 sm:text-ds-primary-400 sm:hover:text-ds-primary-300"
                        : "max-sm:text-ds-neutral-100 max-sm:hover:text-ds-neutral-00 sm:text-ds-neutral-200 sm:hover:text-ds-neutral-00",
                    ].join(" ")
                  : hasActiveFilters
                    ? "text-ds-primary-400 hover:text-ds-primary-300 sm:text-ds-primary-400"
                    : "text-ds-neutral-500 hover:text-ds-neutral-400 sm:text-ds-neutral-200 sm:hover:text-ds-neutral-00",
              ].join(" ")}
              aria-label={t("events.filtersAria")}
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
            >
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className={
                  hasActiveFilters
                    ? "shrink-0 text-inherit"
                    : "shrink-0 max-sm:text-ds-neutral-00 sm:text-inherit"
                }
              >
                <path
                  d="M4.5 7H19.5M7 12H17M10 17H14"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">{t("events.filters")}</span>
            </button>

            {isFilterOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 flex w-64 flex-col gap-0 rounded-2xl bg-ds-neutral-800 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={t("events.filterByTimeRange")}
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown === "time"}
                      onClick={() =>
                        setOpenDropdown((current) =>
                          current === "time" ? null : "time"
                        )
                      }
                      onKeyDown={(event) =>
                        handleDropdownKeyboard(event, "time")
                      }
                      className="flex h-[48px] w-full items-center justify-between rounded-xl bg-ds-neutral-900 px-3 type-body-medium-tight text-ds-neutral-200 outline-none"
                    >
                      <span className="truncate">{selectedTimeRangeLabel}</span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className={`size-4 text-ds-neutral-400 transition-transform ${
                          openDropdown === "time" ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M5.5 7.5L10 12l4.5-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {openDropdown === "time" ? (
                      <ul
                        role="listbox"
                        aria-label={t("events.filterByTimeRangeOptions")}
                        className="filter-popover-list absolute left-0 top-[calc(100%+0.35rem)] z-30 w-full overflow-hidden rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 p-1 shadow-lg"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleCount(EVENTS_BATCH_SIZE);
                              setIsLoadingMore(false);
                              isFetchingRef.current = false;
                              setSelectedTimeRange("all");
                              setOpenDropdown(null);
                            }}
                            className="flex h-12 w-full items-center rounded-lg px-2 text-left text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            {t("events.allRanges")}
                          </button>
                        </li>
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <li key={range}>
                            <button
                              type="button"
                              onClick={() => {
                                setVisibleCount(EVENTS_BATCH_SIZE);
                                setIsLoadingMore(false);
                                isFetchingRef.current = false;
                                setSelectedTimeRange(range);
                                setOpenDropdown(null);
                              }}
                              className="flex h-12 w-full items-center rounded-lg px-2 text-left text-ds-neutral-200 hover:bg-ds-neutral-800"
                            >
                              {timeRangeLabel(range)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      aria-label={t("events.filterByTag")}
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown === "tag"}
                      onClick={() =>
                        setOpenDropdown((current) =>
                          current === "tag" ? null : "tag"
                        )
                      }
                      onKeyDown={(event) => handleDropdownKeyboard(event, "tag")}
                      className="flex w-full items-center justify-between rounded-xl bg-ds-neutral-900 pl-3 pr-3 py-3 type-body-tight text-ds-neutral-200 outline-none"
                    >
                      <span className="truncate">{selectedTagLabel}</span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className={`size-4 text-ds-neutral-400 transition-transform ${
                          openDropdown === "tag" ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M5.5 7.5L10 12l4.5-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {openDropdown === "tag" ? (
                      <ul
                        role="listbox"
                        aria-label={t("events.filterByTagOptions")}
                        className="filter-popover-list modal-scroll absolute left-0 top-[calc(100%+0.35rem)] z-30 max-h-56 w-full overflow-y-auto rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 p-1 shadow-lg"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleCount(EVENTS_BATCH_SIZE);
                              setIsLoadingMore(false);
                              isFetchingRef.current = false;
                              setSelectedTags([]);
                            }}
                            className="flex h-10 w-full items-center justify-between rounded-lg px-2 text-left text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            {t("events.allTags")}
                            {selectedTags.length === 0 ? (
                              <span className="text-ds-success-400">✓</span>
                            ) : null}
                          </button>
                        </li>
                        {availableTags.map((tag) => (
                          <li key={tag}>
                            <button
                              type="button"
                              onClick={() => {
                                setVisibleCount(EVENTS_BATCH_SIZE);
                                setIsLoadingMore(false);
                                isFetchingRef.current = false;
                                setSelectedTags((current) => {
                                  if (current.includes(tag)) {
                                    return current.filter((item) => item !== tag);
                                  }
                                  return [...current, tag];
                                });
                              }}
                              className="flex h-10 w-full items-center justify-between rounded-lg px-2 text-left text-ds-neutral-200 hover:bg-ds-neutral-800"
                            >
                              {tag}
                              {selectedTags.includes(tag) ? (
                                <span className="text-ds-success-400">✓</span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount(EVENTS_BATCH_SIZE);
                    setIsLoadingMore(false);
                    isFetchingRef.current = false;
                    setSelectedTimeRange("all");
                    setSelectedTags([]);
                    setOpenDropdown(null);
                  }}
                  className="mt-4 flex h-10 cursor-pointer items-center justify-center rounded-xl border border-ds-neutral-700 bg-ds-neutral-600 px-3 type-caption-medium text-ds-neutral-200 hover:border-ds-neutral-500 hover:text-ds-neutral-00"
                >
                  {t("events.resetFilters")}
                </button>
              </div>
            ) : null}

            <div className="min-w-0 w-full sm:w-auto sm:shrink-0">
              <ViewToggle mode={viewMode} onChange={(mode) => setViewMode(mode)} />
            </div>
          </div>
        </div>

        {/* Events area (hero event + list) */}
        <section className="min-w-0 flex-1 space-y-16">
          {viewMode === "grid" ? (
            <>
              {nextEvent && (
                <HeroEvent
                  events={heroEvents}
                  onActiveEventChange={(event) => setHeroActiveEventId(event.id)}
                  onExplore={openEventDetails}
                />
              )}
              <div className={nextEvent ? "pt-6" : undefined}>
                <EventGrid
                  events={eventsForEventGrid}
                  onExplore={openEventDetails}
                />
              </div>
            </>
          ) : (
            <EventTimeline
              events={visibleEvents}
              onOpen={openEventDetails}
            />
          )}

          {loadMoreSentinelActive ? (
            <div
              ref={mobileGridSentinelRef}
              className="h-px w-full shrink-0"
              aria-hidden
            />
          ) : null}

          {(isLoadingMore ||
            (hasMoreEvents && (!isNarrowMobile || viewMode !== "grid"))) && (
            <div className="mt-6 flex justify-center">
              {isLoadingMore ? (
                <div
                  className="rounded-full border border-ds-neutral-700 px-4 py-2 type-button-text text-ds-neutral-300"
                  role="status"
                  aria-live="polite"
                >
                  {t("events.loadingMore")}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <footer className="mt-14 font-sans sm:mt-16">
          <div className="relative overflow-hidden rounded-2xl border border-ds-neutral-800 bg-ds-neutral-950 px-0 pt-8 pb-0 text-left sm:rounded-3xl sm:pt-10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-primary-400/40 to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col gap-12">
              <div className="flex w-full flex-col gap-8 px-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <div className="flex min-w-0 w-full flex-col items-center justify-center gap-6 text-body-medium-400 text-ds-neutral-400 lg:items-start lg:justify-start">
                  <BrandLogo
                    size="md"
                    className="shrink-0"
                    aria-label={t("footer.logoAlt")}
                  />
                  <p className="max-w-[600px] whitespace-pre-line text-center text-ds-neutral-400 lg:text-left">
                    {t("footer.supportText")}
                  </p>
                </div>
                <div className="flex min-w-0 w-full flex-col items-center gap-3 lg:max-w-sm lg:items-end lg:text-right">
                  <a
                    href={BUY_ME_A_COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full border border-ds-primary-400/40 bg-ds-primary-400/10 px-10 py-3.5 text-base font-semibold text-ds-primary-300 transition hover:border-ds-primary-400/70 hover:bg-ds-primary-400/15 hover:text-ds-primary-200 sm:w-auto sm:self-center lg:self-end"
                  >
                    {t("footer.buyCoffee")}
                  </a>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 rounded-none bg-ds-neutral-900 px-6 py-6 text-[13px] leading-relaxed text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <p className="min-w-0 text-center text-sm text-ds-neutral-400 lg:flex-1 lg:text-left">
                  {t("footer.disclaimer")}
                </p>
                <p className="w-full shrink-0 text-center text-sm leading-[22px] text-ds-neutral-400 lg:w-auto lg:text-right">
                  {t("footer.createdBy")}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {selectedEvent && (
        <EventDetailsModal
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}