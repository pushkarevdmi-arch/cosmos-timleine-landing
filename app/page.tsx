"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import HeroEvent, { HeroEventData } from "@/components/HeroEvent";
import ViewToggle from "@/components/ViewToggle";
import EventGrid from "@/components/EventGrid";
import EventTimeline from "@/components/EventTimeline";

const eventsSeed: HeroEventData[] = [
  {
    id: "venus-jupiter-great-conjunction-2026",
    title: "Venus–Jupiter Great Conjunction",
    description:
      "Venus and Jupiter will appear extremely close together, forming a brilliant pair in the evening sky.",
    date: "2026-06-09T00:00:00.000Z",
    detailedExplanation:
      "On this night, the two brightest planets in Earth's sky close to within a fraction of a degree, outshining almost every star around them. Through a telescope, each world will still be clearly distinct, but to the unaided eye they will seem to merge into a single, dazzling point of light. Great conjunctions like this are rare alignments of orbital timing and geometry, turning an ordinary sunset into a striking celestial tableau.",
    image: "/images/events/1-100-venus-jupiter-great-conjunction.jpg",
  },
  {
    id: "total-solar-eclipse-europe-2026",
    title: "Total Solar Eclipse Across Europe",
    description:
      "A total solar eclipse will darken parts of Europe as the Moon completely covers the Sun.",
    date: "2026-08-12T00:00:00.000Z",
    detailedExplanation:
      "Sweeping from the North Atlantic across parts of Europe, the Moon's shadow will briefly turn day into an eerie twilight. Observers within the path of totality will see the Sun's bright disk vanish, revealing the ghostly corona and a sky suddenly filled with planets and bright stars. Weather permitting, this will be one of the most memorable astronomical events of the decade for millions of people across the continent.",
    image: "/images/events/1-100-total-solar-eclipse-across-europe.jpg",
  },
  {
    id: "eclipse-of-the-century-2027",
    title: "The “Eclipse of the Century”",
    description:
      "One of the longest solar eclipses of the century, lasting more than six minutes.",
    date: "2027-08-02T00:00:00.000Z",
    detailedExplanation:
      "Because of the precise geometry of the Earth–Moon–Sun system on this date, the Moon's shadow will linger unusually long over parts of the planet. Observers near the centerline of the path will experience totality for more than six minutes, an extraordinarily long time to stand under a black Sun. Such extended eclipses provide a rare opportunity for detailed coronal studies and for simply absorbing the uncanny feeling of a transformed daytime world.",
    image: "/images/events/1-100-the-eclipse-of-the-century.jpg",
  },
  {
    id: "total-solar-eclipse-australia-2028",
    title: "Total Solar Eclipse Over Australia",
    description:
      "A rare total solar eclipse will bring several minutes of darkness to parts of Australia.",
    date: "2028-07-22T00:00:00.000Z",
    detailedExplanation:
      "The Moon's umbra will cross the Australian continent, giving coastal cities and remote outback locations a chance to experience midday darkness. Along the path of totality, the Sun's corona will stretch into space like a pale crown, while the horizon glows in a strange 360-degree sunset. For many in the southern hemisphere, this will be the most accessible total solar eclipse of their lifetimes.",
    image: "/images/events/1-100-total-solar-eclipse-over-australia.jpg",
  },
  {
    id: "apophis-close-flyby-2029",
    title: "Asteroid Apophis Close Flyby",
    description:
      "The asteroid Apophis will pass closer to Earth than many satellites.",
    date: "2029-04-13T21:46:00.000Z",
    detailedExplanation:
      "Once briefly feared as a potential impactor, Apophis will instead make a historic but harmless pass just tens of thousands of kilometers above Earth's surface. Its trajectory will thread the region where geosynchronous satellites orbit, offering scientists an unprecedented chance to watch how Earth's gravity reshapes a small body's path and spin. For observers under the right skies, Apophis may even be visible as a moving point of light racing among the stars.",
    image: "/images/events/1-100-asteroid-apophis-close-flyby.jpg",
  },
  {
    id: "possible-leonid-meteor-storm-2031",
    title: "Possible Leonid Meteor Storm",
    description:
      "Earth may encounter dense comet debris producing an intense meteor storm.",
    date: "2031-11-17T00:00:00.000Z",
    detailedExplanation:
      "If calculations of cometary dust streams are correct, Earth's orbit may slice through a particularly rich filament of material shed by Comet 55P/Tempel–Tuttle. Under dark skies, the familiar Leonid meteor shower could intensify into a true storm, with hundreds or even thousands of meteors per hour. For a few unforgettable hours, the sky might appear to rain with fast, bright streaks all seeming to burst from the constellation Leo.",
    image: "/images/events/1-100-possible-leonid-meteor-storm.jpg",
  },
  {
    id: "saturn-ring-plane-crossing-2038",
    title: "Saturn Ring Plane Crossing",
    description:
      "Saturn’s rings will appear almost invisible as they align edge-on with Earth.",
    date: "2038-10-15T00:00:00.000Z",
    detailedExplanation:
      "As Saturn continues its long orbit around the Sun, there are times when the thin plane of its rings lines up precisely with our line of sight. During a ring-plane crossing, the broad, bright band that usually surrounds the planet seems to vanish, leaving only a razor-thin line. For both backyard observers and professional instruments, this geometry reveals subtle structures in the rings and allows better views of Saturn's moons close to the disk.",
    image: "/images/events/1-100-saturn-ring-plane-crossing.jpg",
  },
  {
    id: "total-solar-eclipse-north-america-2044",
    title: "Total Solar Eclipse Across North America",
    description:
      "A total solar eclipse will sweep across Canada and parts of the United States.",
    date: "2044-08-23T00:00:00.000Z",
    detailedExplanation:
      "Two decades after the great eclipses of the 2020s, the Moon's shadow will once again cross the North American continent. From western Canada into parts of the northern United States, observers along the narrow path will see daylight collapse into a deep twilight. The event will inspire a new generation of skywatchers and provide another opportunity to study how solar activity shapes the corona's ever-changing form.",
    image: "/images/events/1-100-total-solar-eclipse-across-north-america.jpg",
  },
  {
    id: "great-north-american-eclipse-2045",
    title: "Great North American Solar Eclipse",
    description:
      "One of the longest total eclipses visible across the United States this century.",
    date: "2045-08-12T00:00:00.000Z",
    detailedExplanation:
      "Stretching from the Pacific coast of California to the Atlantic shores of Florida, this eclipse path will cut directly across the heart of the United States. Near the middle of the track, totality will last for an exceptionally long duration, giving millions of people extended time under a darkened Sun. The combination of length, accessibility, and likely clear summer weather has earned it a place among the most anticipated eclipses of the century.",
    image: "/images/events/1-100-great-north-american-solar-eclipse.jpg",
  },
  {
    id: "jupiter-closest-opposition-2056",
    title: "Jupiter’s Closest Opposition of the Century",
    description:
      "Jupiter will appear unusually large and bright in Earth’s sky.",
    date: "2056-09-21T00:00:00.000Z",
    detailedExplanation:
      "Around this opposition, Jupiter and Earth will pass especially close as they line up on the same side of the Sun. The gas giant will shine brighter than at any other time in the century, with cloud bands, the Great Red Spot, and its four large Galilean moons easy targets in even small telescopes. For planetary observers, this will be a once-in-a-lifetime opportunity to study Jupiter at its most prominent.",
    image: "/images/events/1-100-jupiters-closest-opposition-of-the-century.jpg",
  },
  {
    id: "halleys-comet-returns-2061",
    title: "Halley’s Comet Returns",
    description:
      "Halley’s Comet will return and may become visible to the naked eye.",
    date: "2061-07-28T00:00:00.000Z",
    detailedExplanation:
      "Roughly every 76 years, the most famous of all comets swings back through the inner solar system, its icy nucleus erupting into a glowing coma and tail. In 2061, Halley’s Comet will once again grace Earth’s skies, potentially developing a tail that stretches across a large swath of the night. The return will connect generations of observers who have watched the same wandering visitor over centuries.",
    image: "/images/events/1-100-halleys-comet-returns.jpg",
  },
  {
    id: "total-solar-eclipse-europe-2081",
    title: "Total Solar Eclipse Across Europe",
    description:
      "A long total solar eclipse will cross much of Europe.",
    date: "2081-09-03T00:00:00.000Z",
    detailedExplanation:
      "Late in the 21st century, another major eclipse track will sweep across European skies, offering an extended period of totality to regions along its central path. Cities and rural landscapes alike will experience the surreal hush and dimming that accompanies the Moon's shadow. For future astronomers, it will be a benchmark opportunity to compare high-resolution observations with those from earlier eclipses decades before.",
    image: "/images/events/1-100-total-solar-eclipse-across-europe.jpg",
  },
  {
    id: "total-solar-eclipse-asia-alaska-2095",
    title: "Total Solar Eclipse Across Asia and Alaska",
    description:
      "A spectacular eclipse will sweep across northern Asia and Alaska.",
    date: "2095-05-25T00:00:00.000Z",
    detailedExplanation:
      "The Moon's umbra will carve a path over sparsely populated regions, arching from northern Asia across the Arctic and into Alaska. Observers who travel into the path will witness the strange contrast of a darkened Sun over bright snow and ice. For climate scientists and eclipse chasers alike, this event will merge frontier travel with cutting-edge observations of the Sun and atmosphere.",
    image: "/images/events/1-100-total-solar-eclipse-across-asia-and-alaska.jpg",
  },
  {
    id: "total-solar-eclipse-north-america-2099",
    title: "Total Solar Eclipse Over North America",
    description:
      "A major solar eclipse will cross North America near the end of the century.",
    date: "2099-09-16T00:00:00.000Z",
    detailedExplanation:
      "As the 21st century draws to a close, yet another total eclipse will visit North America, tracing a new path over cities and landscapes changed by decades of human history. The familiar dance of darkness and light will play out again for a new generation, linking this eclipse to those of 2017, 2024, and 2045. Each event adds another chapter to the long story of how people respond when the Sun briefly disappears.",
    image: "/images/events/1-100-total-solar-eclipse-over-north-america.jpg",
  },
  {
    id: "transit-of-venus-2117",
    title: "Transit of Venus",
    description:
      "Venus will pass across the face of the Sun as a small black disk.",
    date: "2117-12-10T00:00:00.000Z",
    detailedExplanation:
      "Transits of Venus occur in pairs separated by more than a century, making them some of the rarest predictable naked-eye phenomena. During the 2117 event, careful observers using proper solar filters will see a tiny, perfectly round silhouette glide slowly across the Sun's bright disk. Historically, such transits were used to measure the scale of the solar system; in the 22nd century, they will serve as a vivid reminder of orbital mechanics in action.",
    image: "/images/events/1-100-transit-of-venus.jpg",
  },
  {
    id: "total-solar-eclipse-2123",
    title: "Total Solar Eclipse",
    description:
      "A total solar eclipse will cross parts of Asia and the Pacific.",
    date: "2123-06-14T00:00:00.000Z",
    detailedExplanation:
      "The Moon's shadow will once again sweep over densely populated regions and remote ocean waters, plunging observers into minutes of deep twilight. For communities under the path, the event will be both a celebration and a moment of awe as stars and planets emerge around a blackened Sun. Future instruments may capture the corona in exquisite detail across many wavelengths, revealing fine-scale structures in the solar wind.",
    image: "/images/events/1-100-total-solar-eclipse.jpg",
  },
  {
    id: "total-solar-eclipse-2124",
    title: "Total Solar Eclipse",
    description:
      "Another total solar eclipse will be visible from parts of Africa and the Indian Ocean.",
    date: "2124-12-04T00:00:00.000Z",
    detailedExplanation:
      "Only a year after the 2123 eclipse, the geometry will line up again to send the Moon's umbra across a different swath of Earth. This time, the path will favor regions in Africa and the Indian Ocean, drawing travelers to islands and coastal vantage points. The back-to-back eclipses will offer scientists a rare chance to compare coronal structure and solar activity over a short interval.",
    image: "/images/events/1-100-total-solar-eclipse.jpg",
  },
  {
    id: "second-transit-of-venus-2125",
    title: "Second Transit of Venus",
    description:
      "The second event in the rare Venus transit pair.",
    date: "2125-12-08T00:00:00.000Z",
    detailedExplanation:
      "As with previous centuries, the second transit in the Venus pair will follow just a few years after the first, then will not recur for more than a hundred years. Observers will again watch the tiny dark disk of Venus trace a slow path across the Sun, echoing the 2117 event. Together, the pair will bracket a short era in which humanity's understanding of exoplanets and planetary atmospheres may advance dramatically.",
    image: "/images/events/1-100-second-transit-of-venus.jpg",
  },
  {
    id: "annular-solar-eclipse-2126",
    title: "Annular Solar Eclipse",
    description:
      "The Moon will pass in front of the Sun leaving a bright “ring of fire”.",
    date: "2126-02-06T00:00:00.000Z",
    detailedExplanation:
      "During an annular eclipse, the Moon is slightly too small in the sky to cover the Sun completely. Observers along the narrow central track will instead see a blazing ring of sunlight encircling the dark lunar disk. Although the sky does not darken as deeply as during totality, the visual effect is striking, and the event highlights the delicate balance between orbital distance and apparent size.",
    image: "/images/events/1-100-annular-solar-eclipse.jpg",
  },
  {
    id: "comet-swift-tuttle-returns-2126",
    title: "Comet Swift–Tuttle Returns",
    description:
      "The massive comet that creates the Perseid meteor shower returns.",
    date: "2126-08-05T00:00:00.000Z",
    detailedExplanation:
      "Comet Swift–Tuttle is the parent body of the famous Perseid meteor shower, leaving behind a trail of dust and ice grains that Earth crosses each year. In 2126, the comet itself will swing back through the inner solar system, likely growing a bright coma and tail visible in dark skies. Its return will offer a rare opportunity to tie together direct observations of the nucleus with centuries of meteor records from its debris stream.",
    image: "/images/events/1-100-comet-swift-tuttle-returns.jpg",
  },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

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
              {nextEvent && <HeroEvent event={nextEvent} />}
              <EventGrid events={remainingEvents} />
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
              <button
                type="button"
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500 hover:text-white"
                onClick={() => setVisibleCount((count) => count + 10)}
              >
                Show next
              </button>
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
    </div>
  );
}

