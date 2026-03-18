"use client";

import Image from "next/image";
import { useMemo, useState, MouseEvent } from "react";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";
import ButtonSecondary from "@/components/ButtonSecondary";
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

const eventsSeedBase: HeroEventData[] = (eventsData as HeroEventData[]);

const eventsSeed: HeroEventData[] = eventsSeedBase.map((event) => ({
  ...event,
  // Allow content in `data/events.json` to override auto-generated fields.
  // If a field is missing (`undefined`), we fall back to derived content.
  whyItMatters:
    event.whyItMatters ?? deriveWhyItMatters(event.detailedExplanation),
  whatYoullSee:
    event.whatYoullSee ?? deriveWhatYoullSee(event.detailedExplanation),
  keyFacts: event.keyFacts ?? deriveKeyFacts(event.detailedExplanation),
}));

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<HeroEventData | null>(
    null
  );

  const sortedEvents = useMemo(
    () =>
      [...eventsSeed].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    []
  );

  const clampedVisibleCount = Math.min(visibleCount, sortedEvents.length);
  const visibleEvents = sortedEvents.slice(0, clampedVisibleCount);

  const nextEvent = visibleEvents[0];
  const remainingEvents = visibleEvents.slice(1);

  const handleExploreClick = (
    e: MouseEvent<HTMLDivElement>,
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

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-black to-black" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_55%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.3),_transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.28),_transparent_60%)]" />

      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        {/* Top nav / brand */}
        <header className="mb-10 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Cosmic Timeline logo"
              width={148}
              height={16}
              priority
            />
          </div>
        </header>

        {/* Hero heading */}
        <section className="mb-8 flex flex-col items-center justify-center gap-6 lg:mb-6">
          <div className="w-full max-w-none flex flex-col items-center justify-center space-y-3">
            <h1 className="text-balance text-3xl font-normal text-zinc-50 sm:text-4xl lg:text-5xl w-full text-center">
              Journey <span className="font-dynamite">Into</span>
              <br />
              the Future of the Universe
            </h1>
            <p className="max-w-2xl w-full text-sm text-zinc-400 sm:text-base text-center">
              From events that may happen within our lifetime
              to cosmic transformations billions of years away.
            </p>
          </div>
        </section>

        {/* Hero image under main heading */}
        <section className="mb-32 w-full lg:mb-32">
          <div className="relative h-[180px] w-full overflow-hidden rounded-3xl bg-zinc-950">
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
            <h2 className="text-[32px] leading-[44px] font-normal text-background">
              Upcoming Events
            </h2>
          </div>

          <ViewToggle
            mode={viewMode}
            onChange={(mode) => setViewMode(mode)}
          />
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
              selectedId={selectedEventId ?? nextEvent?.id}
              onSelect={(id) => setSelectedEventId(id)}
            />
          )}

          {clampedVisibleCount < sortedEvents.length && (
            <div className="mt-6 flex justify-center">
              <ButtonSecondary
                onClick={() => setVisibleCount((count) => count + 10)}
              >
                Show next events
              </ButtonSecondary>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-zinc-800/80 pt-5 text-xs text-zinc-500">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p>Inspired by real astronomy and long-range cosmology.</p>
            <p className="text-[0.68rem] text-zinc-600">
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

