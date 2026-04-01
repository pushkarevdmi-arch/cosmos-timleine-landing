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
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-ds-neutral-1000/80 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-12">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-[calc(100vw-32px)] max-h-[calc(100dvh-48px)] max-w-[680px] flex-col overflow-hidden rounded-3xl border border-ds-neutral-800 bg-ds-neutral-950/95 shadow-xl backdrop-blur sm:w-full sm:max-h-[calc(100dvh-96px)]">
        <div className="flex items-start justify-between border-b border-ds-neutral-800/80 px-8 py-8">
          <div>
            <h2 className="font-sans text-h4-600 text-ds-neutral-50">
              {title}
            </h2>
            <p
              className="mt-1 type-era-label text-ds-neutral-400"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "18px",
              }}
            >
              {formatFullDate(date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-ds-neutral-700/80 bg-ds-neutral-900 text-[24px] leading-none text-ds-neutral-400 hover:border-ds-neutral-500 hover:text-ds-neutral-100"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-8 px-8 pt-8 pb-12 type-body-tight text-ds-neutral-200">
            <p className="text-[18px] leading-6 text-ds-neutral-300">
              {description}
            </p>

            <section className="space-y-1.5">
              <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
                Why it matters
              </h3>
              <p className="font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeWhyItMatters}
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
                What you&apos;ll see
              </h3>
              <p className="font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeWhatYoullSee}
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
                Key facts
              </h3>
              <ul className="list-disc space-y-3 pl-5 font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeKeyFacts.map((fact) => (
                  <li key={fact}>
                    <div>{fact}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

