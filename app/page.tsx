"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";
import EventDetailsModal from "@/components/EventDetailsModal";
import eventsData from "@/data/events";
import { compareEventDateStrings } from "@/utils/eventDate";
import {
  getTimeRangeSection,
  groupEventsByTimeSection,
} from "@/utils/eventSections";

const BUY_ME_A_COFFEE_URL =
  process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL ?? "https://www.buymeacoffee.com";

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

const eventsSeedBase = eventsData as unknown as HeroEventData[];
/** Cards appended per “load more” / infinite scroll. */
const EVENTS_BATCH_SIZE = 11;
/** Initial slice: covers all current eras in one view when filters are “all” (see sorted `eventsSeed`). */
const INITIAL_VISIBLE_COUNT = 60;
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

const eventsSeed: HeroEventData[] = [...eventsSeedBase].map(
  (event) => ({
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
  })
);

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    TimeRangeOption | "all"
  >("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<FilterDropdown>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEventData | null>(
    null
  );
  const [heroActiveEventId, setHeroActiveEventId] = useState<string | null>(null);
  const [mobileGridSectionsVisible, setMobileGridSectionsVisible] = useState(1);
  const isNarrowMobile = useIsNarrowMobile();
  const isFetchingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const mobileGridSentinelRef = useRef<HTMLDivElement | null>(null);
  const mobileGridSectionsVisibleRef = useRef(1);
  const maxTimeSectionsRef = useRef(0);
  const hasMoreEventsRef = useRef(false);
  const loadMoreEventsRef = useRef<() => void>(() => {});

  const sortedEvents = useMemo(
    () =>
      [...eventsSeed].sort((a, b) => compareEventDateStrings(a.date, b.date)),
    []
  );
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
    setMobileGridSectionsVisible(1);
  }, [selectedTags, selectedTimeRange]);

  const mobileGridSentinelActive =
    isNarrowMobile &&
    viewMode === "grid" &&
    (mobileGridSectionsVisible < timeSectionGroups.length || hasMoreEvents);

  useEffect(() => {
    if (!isNarrowMobile || viewMode !== "grid") return;
    const el = mobileGridSentinelRef.current;
    if (!el) return;

    let canTrigger = true;

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

        const maxS = maxTimeSectionsRef.current;
        const v = mobileGridSectionsVisibleRef.current;
        if (v < maxS) {
          setMobileGridSectionsVisible(Math.min(v + 1, maxS));
        } else if (hasMoreEventsRef.current) {
          loadMoreEventsRef.current();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isNarrowMobile, viewMode, timeSectionGroups, hasMoreEvents, loadMoreEvents]);

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

  useEffect(() => {
    const checkShouldLoad = () => {
      if (isNarrowMobile && viewMode === "grid") return;
      if (isFetchingRef.current || !hasMoreEvents) return;
      const thresholdPx = 320;
      const scrollBottom = window.innerHeight + window.scrollY;
      const pageBottom = document.documentElement.scrollHeight;
      if (pageBottom - scrollBottom <= thresholdPx) {
        loadMoreEvents();
      }
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        checkShouldLoad();
      });
    };

    checkShouldLoad();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [hasMoreEvents, isNarrowMobile, loadMoreEvents, viewMode]);

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
    selectedTimeRange === "all" ? "All ranges" : selectedTimeRange;
  const selectedTagLabel =
    selectedTags.length === 0
      ? "All tags"
      : selectedTags.length === 1
      ? selectedTags[0]
      : `${selectedTags.length} tags selected`;
  const hasActiveFilters =
    selectedTimeRange !== "all" || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-ds-neutral-1000 text-ds-neutral-100">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-ds-neutral-1000" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_55%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.3),_transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.28),_transparent_60%)]" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pt-6 xl:max-w-[min(84rem,calc(100vw-6rem))]">
        {/* Top nav / brand */}
        <header className="mb-[144px] flex flex-col items-center justify-center sm:mb-[104px]">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Cosmic Timeline logo"
              width={120}
              height={16}
              priority
            />
          </div>
        </header>

        {/* Hero heading */}
        <section className="mb-8 flex flex-col items-center justify-center gap-6 lg:mb-6">
          <div className="w-full max-w-none flex flex-col items-center justify-center space-y-3">
            <h1 className="font-sans text-h1-400 text-ds-neutral-50 w-full text-center">
              Journey{" "}
              <span
                className="font-dynamite leading-[40px] h-[40px] inline-block"
                style={{ fontFamily: "Dynamite" }}
              >
                Into
              </span>
              <br />
              the Future of the Universe
            </h1>
            <p className="max-w-2xl w-full font-sans text-body-medium-400 text-ds-neutral-400 text-center">
              From events in our lifetime to cosmic changes billions of years ahead.
            </p>
          </div>
        </section>

        <section className="mb-32 h-[240px] w-full rounded-[22px] border border-ds-neutral-850 [border-image:none] lg:mb-32">
          <div className="relative h-[240px] w-full overflow-hidden rounded-3xl border-2 border-ds-neutral-900 bg-ds-neutral-950 shadow-[inset_0_-12px_24px_-12px_rgba(0,0,0,0.35)]">
            <video
              className="block h-[240px] w-full object-cover"
              src="/videos/hero-video2.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* View toggle */}
        <section className="mb-9 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full text-center sm:text-left">
            <h2 className="font-sans text-[28px] leading-tight text-ds-neutral-00 sm:text-h2-400">
              Upcoming{" "}
              <span
                className="font-dynamite"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Events
              </span>
            </h2>
          </div>

          <div
            className="relative flex w-full flex-row-reverse items-center justify-between gap-4 sm:w-auto sm:gap-3 sm:flex-row sm:justify-end"
            ref={filterPopoverRef}
          >
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
                "max-sm:size-14 rounded-xl border border-ds-neutral-800 bg-ds-neutral-900",
                "sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:border-0 sm:bg-transparent sm:px-3 sm:py-2",
                "text-base font-bold",
                isFilterOpen
                  ? [
                      "max-sm:border-transparent max-sm:bg-ds-neutral-700 max-sm:text-ds-neutral-100 max-sm:hover:text-ds-neutral-00",
                      hasActiveFilters
                        ? "sm:text-ds-primary-400 sm:hover:text-ds-primary-300"
                        : "sm:text-ds-neutral-200 sm:hover:text-ds-neutral-00",
                    ].join(" ")
                  : hasActiveFilters
                    ? "text-ds-primary-400 hover:text-ds-primary-300 sm:text-ds-primary-400"
                    : "text-ds-neutral-500 hover:text-ds-neutral-400 sm:text-ds-neutral-200 sm:hover:text-ds-neutral-00",
              ].join(" ")}
              aria-label="Filters"
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
                className="shrink-0"
              >
                <path
                  d="M4.5 7H19.5M7 12H17M10 17H14"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Filters</span>
            </button>

            {isFilterOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-2xl bg-ds-neutral-800 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Filter by time range"
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
                      className="flex w-full items-center justify-between rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 pl-3 pr-3 py-3 type-caption-medium text-ds-neutral-200 outline-none hover:border-ds-neutral-500"
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
                        aria-label="Filter by time range options"
                        className="absolute left-0 top-[calc(100%+0.35rem)] z-30 w-full overflow-hidden rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 p-1 shadow-lg"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleCount(INITIAL_VISIBLE_COUNT);
                              setIsLoadingMore(false);
                              isFetchingRef.current = false;
                              setSelectedTimeRange("all");
                              setOpenDropdown(null);
                            }}
                            className="w-full rounded-lg px-2 py-3 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            All ranges
                          </button>
                        </li>
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <li key={range}>
                            <button
                              type="button"
                              onClick={() => {
                                setVisibleCount(INITIAL_VISIBLE_COUNT);
                                setIsLoadingMore(false);
                                isFetchingRef.current = false;
                                setSelectedTimeRange(range);
                                setOpenDropdown(null);
                              }}
                              className="w-full rounded-lg px-2 py-3 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
                            >
                              {range}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Filter by tag"
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown === "tag"}
                      onClick={() =>
                        setOpenDropdown((current) =>
                          current === "tag" ? null : "tag"
                        )
                      }
                      onKeyDown={(event) => handleDropdownKeyboard(event, "tag")}
                      className="flex w-full items-center justify-between rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 pl-3 pr-3 py-3 type-caption-medium text-ds-neutral-200 outline-none hover:border-ds-neutral-500"
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
                        aria-label="Filter by tag options"
                        className="absolute left-0 top-[calc(100%+0.35rem)] z-30 max-h-56 w-full overflow-y-auto rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 p-1 shadow-lg"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleCount(INITIAL_VISIBLE_COUNT);
                              setIsLoadingMore(false);
                              isFetchingRef.current = false;
                              setSelectedTags([]);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            All tags
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
                                setVisibleCount(INITIAL_VISIBLE_COUNT);
                                setIsLoadingMore(false);
                                isFetchingRef.current = false;
                                setSelectedTags((current) => {
                                  if (current.includes(tag)) {
                                    return current.filter((item) => item !== tag);
                                  }
                                  return [...current, tag];
                                });
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
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

                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(INITIAL_VISIBLE_COUNT);
                      setIsLoadingMore(false);
                      isFetchingRef.current = false;
                      setSelectedTimeRange("all");
                      setSelectedTags([]);
                      setOpenDropdown(null);
                    }}
                    className="rounded-xl border border-ds-neutral-700 px-3 py-3 type-caption-medium text-ds-neutral-200 hover:border-ds-neutral-500 hover:text-ds-neutral-00 cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : null}

            <div className="min-w-0 flex-1 sm:flex-initial">
              <ViewToggle mode={viewMode} onChange={(mode) => setViewMode(mode)} />
            </div>
          </div>
        </section>

        {/* Events area (hero event + list) */}
        <section className="min-w-0 flex-1 space-y-16">
          {viewMode === "grid" ? (
            <>
              {nextEvent && (
                <HeroEvent
                  events={heroEvents}
                  onActiveEventChange={(event) => setHeroActiveEventId(event.id)}
                  onExplore={(event) => setSelectedEvent(event)}
                />
              )}
              <div className={nextEvent ? "pt-6" : undefined}>
                <EventGrid
                  events={eventsForEventGrid}
                  onExplore={(event) => setSelectedEvent(event)}
                />
              </div>
              {mobileGridSentinelActive ? (
                <div
                  ref={mobileGridSentinelRef}
                  className="h-px w-full shrink-0"
                  aria-hidden
                />
              ) : null}
            </>
          ) : (
            <EventTimeline
              events={visibleEvents}
              onOpen={(event) => setSelectedEvent(event)}
            />
          )}

          {(isLoadingMore ||
            (hasMoreEvents && (!isNarrowMobile || viewMode !== "grid"))) && (
            <div className="mt-6 flex justify-center">
              {isLoadingMore ? (
                <div
                  className="rounded-full border border-ds-neutral-700 px-4 py-2 type-button-text text-ds-neutral-300"
                  role="status"
                  aria-live="polite"
                >
                  Loading more events...
                </div>
              ) : null}
            </div>
          )}
        </section>

        <footer className="mt-14 font-sans sm:mt-16">
          <div className="relative overflow-hidden rounded-2xl border border-ds-neutral-800 bg-gradient-to-b from-ds-neutral-900/90 to-ds-neutral-950 px-5 py-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:rounded-3xl sm:px-8 sm:py-10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-primary-400/40 to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col gap-8">
              <div>
                <p className="max-w-2xl text-[17px] font-medium leading-7 text-ds-neutral-100 sm:text-lg sm:leading-8">
                  Inspired by real astronomy and long-range cosmology.
                </p>
              </div>

              <div className="max-w-2xl space-y-3 text-body-medium-400 text-ds-neutral-400">
                <p>
                  Created with passion by{" "}
                  <span className="font-medium text-ds-neutral-200">
                    Dmitri Pushkarev
                  </span>{" "}
                  — an independent astronomy enthusiast.
                  <br />
                  This project is a non-commercial labor of love.
                </p>
                <div className="flex flex-col gap-3 pt-1">
                  <p className="text-[17px] text-ds-neutral-400">
                    If you enjoy the site and want to support its development,
                    you can
                  </p>
                  <a
                    href={BUY_ME_A_COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ds-primary-400/40 bg-ds-primary-400/10 px-5 py-2.5 text-sm font-semibold text-ds-primary-300 transition hover:border-ds-primary-400/70 hover:bg-ds-primary-400/15 hover:text-ds-primary-200 sm:w-auto sm:self-start"
                  >
                    Buy me a coffee
                    <span className="text-base leading-none opacity-80" aria-hidden>
                      ↗
                    </span>
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-ds-neutral-850 bg-ds-neutral-950/70 px-4 py-3.5 text-[13px] leading-relaxed text-ds-neutral-600 sm:px-5">
                All times and distances are approximate and simplified for an
                immersive experience.
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