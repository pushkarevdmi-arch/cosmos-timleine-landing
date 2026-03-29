"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";
import EventDetailsModal from "@/components/EventDetailsModal";
import eventsData from "@/data/events.json";

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function deriveWhyItMatters(detailedExplanation: string) {
  const sentences = splitSentences(detailedExplanation);
  const why = sentences.slice(0, 2).join(" ");
  return why || detailedExplanation;
}

function deriveWhatYoullSee(detailedExplanation: string) {
  const sentences = splitSentences(detailedExplanation);
  const part = sentences.slice(2, 5).join(" ");

  // Fallback: if the explanation is short, use the last sentences.
  return part || sentences.slice(-2).join(" ") || detailedExplanation;
}

function deriveKeyFacts(detailedExplanation: string) {
  const sentences = splitSentences(detailedExplanation);
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

function getTimeRangeSectionLabel(event: HeroEventData): TimeRangeOption {
  if (event.timeSection) return event.timeSection;

  const eventYear = new Date(event.date).getUTCFullYear();
  if (!Number.isFinite(eventYear)) return "Next 100 Years";

  const currentYear = new Date().getUTCFullYear();
  const yearsAhead = Math.max(0, eventYear - currentYear);

  if (yearsAhead <= 100) return "Next 100 Years";
  if (yearsAhead <= 10000) return "Next 10,000 Years";
  if (yearsAhead <= 1000000000) return "Millions of Years";
  return "Billions of Years";
}

const eventsSeedBase: HeroEventData[] = (eventsData as HeroEventData[]);
const EVENTS_BATCH_SIZE = 11;
const TIME_RANGE_OPTIONS = [
  "Next 100 Years",
  "Next 10,000 Years",
  "Millions of Years",
  "Billions of Years",
] as const;
type TimeRangeOption = (typeof TIME_RANGE_OPTIONS)[number];
type FilterDropdown = "time" | "tag" | null;
const SECTION_PLACEHOLDER_EVENTS: HeroEventData[] = [
  {
    id: "placeholder-next-10000-years",
    title: "Interstellar Probe Milestone",
    description: "A marker event to represent the next 10,000 years section.",
    date: "6000-01-01T00:00:00.000Z",
    detailedExplanation:
      "This placeholder event is shown to demonstrate visual grouping for long-range timeline periods.",
    image: "/images/hero-image.jpg",
    tag: "Timeline Marker",
    timeSection: "Next 10,000 Years",
  },
  {
    id: "placeholder-millions-of-years",
    title: "Galactic Drift Checkpoint",
    description: "A marker event to represent the millions of years section.",
    date: "12000-01-01T00:00:00.000Z",
    detailedExplanation:
      "This placeholder event is shown to demonstrate visual grouping for million-year timeline periods.",
    image: "/images/hero-image.jpg",
    tag: "Timeline Marker",
    timeSection: "Millions of Years",
  },
  {
    id: "placeholder-billions-of-years",
    title: "Far Future Cosmic Marker",
    description: "A marker event to represent the billions of years section.",
    date: "22000-01-01T00:00:00.000Z",
    detailedExplanation:
      "This placeholder event is shown to demonstrate visual grouping for billion-year timeline periods.",
    image: "/images/hero-image.jpg",
    tag: "Timeline Marker",
    timeSection: "Billions of Years",
  },
];
const EVENT_TAGS: Record<string, string> = {
  "venus-jupiter-great-conjunction-2026": "Conjunction",
  "total-solar-eclipse-europe-2026": "Eclipse",
  "eclipse-of-the-century-2027": "Eclipse",
  "total-solar-eclipse-australia-2028": "Eclipse",
  "apophis-close-flyby-2029": "Asteroid",
  "possible-leonid-meteor-storm-2031": "Meteor Shower",
  "saturn-ring-plane-crossing-2038": "Planetary Event",
  "total-solar-eclipse-north-america-2044": "Eclipse",
  "great-north-american-eclipse-2045": "Eclipse",
  "jupiter-closest-opposition-2056": "Planetary Event",
  "halleys-comet-returns-2061": "Comet",
  "total-solar-eclipse-europe-2081": "Eclipse",
  "total-solar-eclipse-asia-alaska-2095": "Eclipse",
  "total-solar-eclipse-north-america-2099": "Eclipse",
  "transit-of-venus-2117": "Transit",
  "total-solar-eclipse-2123": "Eclipse",
  "total-solar-eclipse-2124": "Eclipse",
  "second-transit-of-venus-2125": "Transit",
  "annular-solar-eclipse-2126": "Eclipse",
  "comet-swift-tuttle-returns-2126": "Cometary Event",
};

const eventsSeed: HeroEventData[] = [...eventsSeedBase, ...SECTION_PLACEHOLDER_EVENTS].map(
  (event) => ({
    ...event,
    tag: event.tag ?? EVENT_TAGS[event.id] ?? "Solar system",
    // Allow content in `data/events.json` to override auto-generated fields.
    // If a field is missing (`undefined`), we fall back to derived content.
    whyItMatters:
      event.whyItMatters ?? deriveWhyItMatters(event.detailedExplanation),
    whatYoullSee:
      event.whatYoullSee ?? deriveWhatYoullSee(event.detailedExplanation),
    keyFacts: event.keyFacts ?? deriveKeyFacts(event.detailedExplanation),
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
  const [visibleCount, setVisibleCount] = useState(EVENTS_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEventData | null>(
    null
  );
  const isFetchingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...eventsSeed].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    []
  );
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const event of sortedEvents) {
      if (event.tag) tags.add(event.tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [sortedEvents]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      const matchesTimeRange =
        selectedTimeRange === "all" ||
        getTimeRangeSectionLabel(event) === selectedTimeRange;
      const matchesTag =
        selectedTags.length === 0 ||
        (event.tag ? selectedTags.includes(event.tag) : false);
      return matchesTimeRange && matchesTag;
    });
  }, [selectedTags, selectedTimeRange, sortedEvents]);

  const clampedVisibleCount = Math.min(visibleCount, filteredEvents.length);
  const visibleEvents = filteredEvents.slice(0, clampedVisibleCount);
  const hasMoreEvents = clampedVisibleCount < filteredEvents.length;

  const nextEvent = visibleEvents[0];
  const remainingEvents = visibleEvents.slice(1);

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

  useEffect(() => {
    setVisibleCount(EVENTS_BATCH_SIZE);
  }, [selectedTags, selectedTimeRange]);

  useEffect(() => {
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (!filterPopoverRef.current) return;
      const target = event.target as Node | null;
      if (target && !filterPopoverRef.current.contains(target)) {
        setIsFilterOpen(false);
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
    if (!isFilterOpen) setOpenDropdown(null);
  }, [isFilterOpen]);

  useEffect(() => {
    const checkShouldLoad = () => {
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
  }, [hasMoreEvents, loadMoreEvents]);

  const handleExploreClick = (
    e: ReactMouseEvent<HTMLDivElement>,
    event: HeroEventData
  ) => {
    const target = e.target as HTMLElement | null;
    if (!target || !target.closest) return;

    const button = target.closest("button");
    if (!button) return;

    const hasExploreIcon = button.querySelector(".event-card__explore-icon");
    if (hasExploreIcon) {
      setSelectedEvent(event);
    }
  };

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

  return (
    <div className="min-h-screen bg-ds-neutral-1000 text-ds-neutral-100">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-ds-neutral-1000" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_55%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.3),_transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.28),_transparent_60%)]" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pt-10 xl:max-w-[min(84rem,calc(100vw-6rem))]">
        {/* Top nav / brand */}
        <header className="mb-16 flex flex-col items-center justify-center">
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
              Journey <span className="font-dynamite">Into</span>
              <br />
              the Future of the Universe
            </h1>
            <p className="max-w-2xl w-full font-sans text-body-medium-400 text-ds-neutral-400 text-center">
              From events in our lifetime to cosmic changes billions of years ahead.
            </p>
          </div>
        </section>

        {/* Hero image under main heading */}
        <section className="mb-32 w-full lg:mb-32">
          <div className="relative h-[180px] w-full overflow-hidden rounded-3xl bg-ds-neutral-950">
            <Image
              src="/images/hero-image.jpg"
              alt="Cosmic landscape representing the journey into the future of the universe"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 1120px, 100vw"
              priority
            />
          </div>
        </section>

        {/* View toggle */}
        <section className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-h2-400 text-ds-neutral-00">
              Upcoming Events
            </h2>
          </div>

          <div className="relative flex items-center gap-3" ref={filterPopoverRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-base font-bold text-ds-neutral-200 hover:text-ds-neutral-00 cursor-pointer"
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
            >
              <svg
                width={20}
                height={20}
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
              Filters
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
                      className="flex w-full items-center justify-between rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 pl-3 pr-3 py-2 type-caption-medium text-ds-neutral-200 outline-none hover:border-ds-neutral-500"
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
                              setSelectedTimeRange("all");
                              setOpenDropdown(null);
                            }}
                            className="w-full rounded-lg px-2 py-2 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            All ranges
                          </button>
                        </li>
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <li key={range}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTimeRange(range);
                                setOpenDropdown(null);
                              }}
                              className="w-full rounded-lg px-2 py-2 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
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
                      className="flex w-full items-center justify-between rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 pl-3 pr-3 py-2 type-caption-medium text-ds-neutral-200 outline-none hover:border-ds-neutral-500"
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
                              setSelectedTags([]);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left type-caption-medium text-ds-neutral-200 hover:bg-ds-neutral-800"
                          >
                            All tags
                            {selectedTags.length === 0 ? (
                              <span className="text-ds-neutral-400">✓</span>
                            ) : null}
                          </button>
                        </li>
                        {availableTags.map((tag) => (
                          <li key={tag}>
                            <button
                              type="button"
                              onClick={() => {
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
                                <span className="text-ds-neutral-400">✓</span>
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
                      setSelectedTimeRange("all");
                      setSelectedTags([]);
                      setOpenDropdown(null);
                    }}
                    className="rounded-xl border border-ds-neutral-700 px-3 py-2 type-caption-medium text-ds-neutral-200 hover:border-ds-neutral-500 hover:text-ds-neutral-00 cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : null}

            <ViewToggle mode={viewMode} onChange={(mode) => setViewMode(mode)} />
          </div>
        </section>

        {/* Events area (hero event + list) */}
        <section className="flex-1 space-y-6">
          {viewMode === "grid" ? (
            <>
              {nextEvent && (
                <div
                  onClick={(e) => handleExploreClick(e, nextEvent)}
                  className="cursor-default"
                >
                  <HeroEvent event={nextEvent} />
                </div>
              )}
              <EventGrid
                events={remainingEvents}
                onExplore={(event) => setSelectedEvent(event)}
              />
            </>
          ) : (
            <EventTimeline
              events={visibleEvents}
              onOpen={(event) => setSelectedEvent(event)}
            />
          )}

          {(isLoadingMore || hasMoreEvents) && (
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

        {/* Footer */}
        <footer className="mt-10 border-t border-ds-neutral-800/80 pt-5 font-sans text-body-small-400 text-ds-neutral-500">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p>Inspired by real astronomy and long-range cosmology.</p>
            <p className="font-sans text-body-small-400 text-ds-neutral-600">
              Times and distances are approximate and simplified for an
              immersive experience.
            </p>
          </div>
        </footer>
      </main>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}