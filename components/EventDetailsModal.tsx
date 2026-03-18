"use client";

import type { HeroEventData } from "./HeroEvent";
import { useEffect } from "react";

type EventDetailsModalProps = {
  event: HeroEventData;
  onClose: () => void;
};

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

export default function EventDetailsModal({
  event,
  onClose,
}: EventDetailsModalProps) {
  const {
    title,
    description,
    date,
    detailedExplanation,
    whyItMatters,
    whatYoullSee,
    keyFacts,
  } = event;

  const safeWhyItMatters =
    whyItMatters ??
    detailedExplanation ??
    "This event marks a significant moment in the evolving story of our universe, giving a rare window into large-scale cosmic processes.";

  const safeWhatYoullSee =
    whatYoullSee ??
    "Under clear skies, the view will be striking even to the unaided eye, and transforms further through binoculars or a small telescope.";

  const safeKeyFacts =
    keyFacts && keyFacts.length
      ? keyFacts
      : [
          `Approximate date: ${formatFullDate(date)}`,
          "Timing, visibility, and exact appearance can vary based on your location and observing conditions.",
        ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between border-b border-zinc-800/80 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50 sm:text-xl">
              {title}
            </h2>
            <p
              className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-400"
              style={{
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 400,
              }}
            >
              {formatFullDate(date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 text-sm text-zinc-200 sm:px-6 sm:py-6">
          <p className="text-zinc-300">{description}</p>

          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Why it matters
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300">
              {safeWhyItMatters}
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              What you&apos;ll see
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300">
              {safeWhatYoullSee}
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Key facts
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-300">
              {safeKeyFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

