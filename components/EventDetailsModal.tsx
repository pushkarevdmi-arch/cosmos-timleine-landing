"use client";

import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
} from "@/utils/eventDate";
import type { HeroEventData } from "./HeroEvent";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type EventDetailsModalProps = {
  event: HeroEventData;
  onClose: () => void;
};

export default function EventDetailsModal({
  event,
  onClose,
}: EventDetailsModalProps) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const {
    title,
    date,
    mainDescription,
    whyItMatters,
    whatYoullSee,
    keyFacts,
    nextOccurrences,
  } = event;

  const safeWhyItMatters =
    whyItMatters ??
    mainDescription ??
    "This event marks a significant moment in the evolving story of our universe, giving a rare window into large-scale cosmic processes.";

  const safeWhatYoullSee =
    whatYoullSee ??
    "Under clear skies, the view will be striking even to the unaided eye, and transforms further through binoculars or a small telescope.";

  const safeKeyFacts =
    keyFacts && keyFacts.length
      ? keyFacts
      : [
          `Approximate date: ${formatEventDateOnlyLong(date)}${
            eventHasSpecificUtcTime(date)
              ? ` · ${formatEventTimeUtcLabel(date)}`
              : ""
          }`,
          "Timing, visibility, and exact appearance can vary based on your location and observing conditions.",
        ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!portalReady) return null;

  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center overflow-y-auto bg-ds-neutral-1000/80 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-12">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-[calc(100vw-32px)] max-h-[calc(100dvh-48px)] max-w-[680px] flex-col overflow-hidden rounded-3xl border border-ds-neutral-800 bg-ds-neutral-950/95 shadow-xl backdrop-blur sm:w-full sm:max-h-[calc(100dvh-96px)]">
        <div className="flex flex-col gap-4 bg-ds-neutral-900 px-8 py-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col pl-[3px] pr-[3px] max-sm:pr-8 max-w-[560px]">
              <h2 className="break-words font-sans text-h4-600 text-ds-neutral-50">
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ds-neutral-700/80 bg-ds-neutral-900 text-[24px] leading-none text-ds-neutral-400 hover:border-ds-neutral-500 hover:text-ds-neutral-100 max-sm:absolute max-sm:right-4 max-sm:top-4 max-sm:z-40 sm:static"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          <div
            className="flex w-full flex-row flex-nowrap items-center gap-2 whitespace-nowrap sm:gap-3 type-era-label text-ds-neutral-400 pl-[3px] pr-[3px]"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "18px",
            }}
          >
            <span>{formatEventDateOnlyLong(date)}</span>
            {eventHasSpecificUtcTime(date) ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-[14px] w-px self-center bg-ds-neutral-700"
                />
                <span className="text-ds-neutral-500">
                  {formatEventTimeUtcLabel(date)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll">
          <div className="flex flex-col gap-8 px-8 pt-8 pb-12 type-body-tight text-ds-neutral-200">
            <p className="text-[18px] leading-[26px] text-ds-neutral-300">
              {mainDescription}
            </p>

            <section className="flex flex-col gap-2">
              <h3
                className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500"
                style={{ fontSize: "14px", lineHeight: "18px" }}
              >
                Why it matters
              </h3>
              <p className="font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeWhyItMatters}
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3
                className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500"
                style={{ fontSize: "14px", lineHeight: "18px" }}
              >
                What you&apos;ll see
              </h3>
              <p className="font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeWhatYoullSee}
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
                Key facts
              </h3>
              <ul className="list-disc flex flex-col gap-2 pl-5 font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                {safeKeyFacts.map((fact) => (
                  <li key={fact}>
                    <div>{fact}</div>
                  </li>
                ))}
              </ul>
            </section>

            {nextOccurrences && nextOccurrences.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h3 className="font-sans text-body-small-600 uppercase tracking-caps text-ds-neutral-500">
                  Next time
                </h3>
                <ul className="list-disc flex flex-col gap-2 pl-5 font-sans text-body-large-400 leading-6 text-ds-neutral-300">
                  {nextOccurrences.map((line) => (
                    <li key={line}>
                      <div>{line}</div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

