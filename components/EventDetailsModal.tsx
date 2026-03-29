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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ds-neutral-1000/80 px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-ds-neutral-800 bg-ds-neutral-950/95 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between border-b border-ds-neutral-800/80 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-sans text-h3-600 text-ds-neutral-50">
              {title}
            </h2>
            <p
              className="mt-1 type-era-label text-ds-neutral-400"
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
            className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ds-neutral-700/80 text-ds-neutral-400 hover:border-ds-neutral-500 hover:text-ds-neutral-100"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 type-body-tight text-ds-neutral-200 sm:px-6 sm:py-6">
          <p className="text-ds-neutral-300">{description}</p>

          <section className="space-y-1.5">
            <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
              Why it matters
            </h3>
            <p className="font-sans text-body-large-400 text-ds-neutral-300">
              {safeWhyItMatters}
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
              What you&apos;ll see
            </h3>
            <p className="font-sans text-body-large-400 text-ds-neutral-300">
              {safeWhatYoullSee}
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
              Key facts
            </h3>
            <ul className="list-disc space-y-1 pl-5 font-sans text-body-large-400 text-ds-neutral-300">
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

