"use client";

import { useMemo, useState } from "react";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";

const eventsSeed: HeroEventData[] = [
  {
    id: "near-future-eclipse",
    title: "Total Solar Eclipse over North America",
    description:
      "The Moon aligns perfectly with the Sun, casting a sweeping shadow across Earth and plunging day into a brief, eerie twilight.",
    date: "2026-08-12T18:30:00.000Z",
    detailedExplanation:
      "During a total solar eclipse, the Moon's apparent size fully covers the Sun, revealing the delicate structure of the solar corona. Temperatures can drop noticeably, animals behave as if night has fallen, and the stars briefly return to the daytime sky. Astronomers use these moments to study coronal dynamics, magnetic fields, and the solar wind from a vantage point impossible at any other time.",
    image: "/images/events/solar-eclipse.jpg",
  },
  {
    id: "galactic-alignment",
    title: "Solar System Crosses Galactic Plane",
    description:
      "Our system glides through the Milky Way's mid-plane, subtly changing our cosmic neighborhood on million-year timescales.",
    date: "3000-01-01T00:00:00.000Z",
    detailedExplanation:
      "The Sun orbits the Milky Way while bobbing above and below its mid-plane. Crossing this dense region very slowly alters the flux of interstellar material, the pattern of nearby stars, and the long-term background of cosmic rays. While uneventful on human timescales, these passes are part of the deep-time choreography that shapes planetary climates and stellar encounters.",
    image: "/images/events/galactic-plane.jpg",
  },
  {
    id: "andromeda-encounter",
    title: "First Tidal Encounter with Andromeda",
    description:
      "The Milky Way and Andromeda galaxies begin their slow gravitational dance, reshaping the night sky with vast stellar arcs.",
    date: "4000000000-01-01T00:00:00.000Z",
    detailedExplanation:
      "As the Andromeda Galaxy approaches, its gravity distorts both galaxies into long, luminous tidal tails. From any surviving worlds, the sky would be filled with colossal arcs and glowing rivers of stars. Over billions of years, these interactions funnel gas, trigger waves of star formation, and ultimately merge both galaxies into a single, more massive stellar city.",
    image: "/images/events/andromeda-encounter.jpg",
  },
  {
    id: "stellar-red-giant",
    title: "Sun Enters Red Giant Phase",
    description:
      "The Sun swells into a red giant, transforming the architecture of the inner solar system forever.",
    date: "5500000000-01-01T00:00:00.000Z",
    detailedExplanation:
      "When hydrogen in the Sun's core is exhausted, fusion migrates outward and the star expands dramatically. Its outer layers cool and redden while its radius increases hundreds of times. The orbits of inner planets are engulfed or destabilized, and any remaining worlds in the habitable zone would orbit far from a swollen, ember-red Sun blazing across a transformed sky.",
    image: "/images/events/red-giant-sun.jpg",
  },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...eventsSeed].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    []
  );

  const nextEvent = sortedEvents[0];
  const remainingEvents = sortedEvents.slice(1);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-black to-black" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_55%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.3),_transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.28),_transparent_60%)]" />

      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        {/* Top nav / brand */}
        <header className="mb-10 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-zinc-400 uppercase">
                Cosmic Timeline
              </p>
            </div>
          </div>
        </header>

        {/* Hero section */}
        <section className="mb-8 flex flex-col items-center justify-center gap-10 lg:mb-10">
          <div className="max-w-[600px] w-full flex flex-col items-center justify-center space-y-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl w-full text-center">
              Discover the cosmic events that await.
            </h1>
            <p className="max-w-2xl w-full text-sm text-zinc-400 sm:text-base text-center">
              Move beyond the next launch window. Explore eclipses, stellar
              collisions, and galaxy-scale transformations, ordered from the
              next moment in time to billions of years ahead.
            </p>
          </div>

          {nextEvent && <HeroEvent event={nextEvent} />}
        </section>

        {/* View toggle */}
        <section className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold tracking-[0.26em] text-zinc-500 uppercase">
              Explore the timeline
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Switch between a compact grid of events or a continuous timeline
              stretching into the deep future.
            </p>
          </div>

          <ViewToggle
            mode={viewMode}
            onChange={(mode) => setViewMode(mode)}
          />
        </section>

        {/* Events area */}
        <section className="flex-1">
          {viewMode === "grid" ? (
            <EventGrid events={remainingEvents} />
          ) : (
            <EventTimeline
              events={sortedEvents}
              selectedId={selectedEventId ?? nextEvent?.id}
              onSelect={(id) => setSelectedEventId(id)}
            />
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
    </div>
  );
}

