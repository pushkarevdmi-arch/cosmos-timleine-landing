"use client";

import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
} from "@/utils/eventDate";
import type { HeroEventData } from "./HeroEvent";
import EventRarityScale from "./EventRarityScale";
import { EventCategoryTag } from "./EventTagGroup";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type TransitionEvent,
} from "react";
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
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const requestClose = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onClose();
      return;
    }
    setExiting(true);
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Mobile Safari sometimes skips `transitionend` on transform; without this the portal
  // (and dim layer on desktop) never unmounts.
  useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(() => {
      onClose();
    }, 360);
    return () => window.clearTimeout(id);
  }, [exiting, onClose]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyPaddingRight = body.style.paddingRight;

    const scrollbarW = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarW > 0) {
      body.style.paddingRight = `${scrollbarW}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.paddingRight = prevBodyPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const {
    title,
    date,
    image,
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
      if (e.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  function handlePanelTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    if (exiting) onClose();
  }

  if (!portalReady) return null;

  const panelOpen = entered && !exiting;

  return createPortal(
    <div className="fixed inset-0 z-[20000]">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 hidden cursor-default bg-ds-neutral-1000/80 backdrop-blur-sm md:block"
        onClick={requestClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-details-title"
        className={`absolute right-0 top-0 z-10 flex h-full w-full max-w-[680px] flex-col overflow-hidden border-l border-ds-neutral-800 bg-ds-neutral-950/95 shadow-xl backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-ds-neutral-950 sm:h-[220px]">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 680px) 100vw, 680px"
            className="object-cover"
            priority
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ds-neutral-1000/40 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={requestClose}
            className="pointer-events-auto absolute right-4 top-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-ds-neutral-700/80 bg-ds-neutral-900/90 text-[24px] leading-none text-ds-neutral-100 shadow-lg backdrop-blur-sm hover:border-ds-neutral-500 hover:bg-ds-neutral-900"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto modal-scroll bg-[var(--app-surface-elevated)]">
          <div className="flex flex-col gap-8 bg-[var(--app-surface-elevated)] px-8 pb-12 pt-8 type-body-tight text-ds-neutral-200">
            <div className="flex flex-col gap-4">
              <div className="pl-[3px] pr-[3px]">
                <EventCategoryTag primaryTag={event.tags?.[0]} />
              </div>
              <h2
                id="event-details-title"
                className="break-words pl-[3px] pr-[3px] font-sans text-h4-600 text-ds-neutral-50"
              >
                {title}
              </h2>

              <div
                className="mx-[3px] h-px shrink-0 bg-[var(--ds-neutral-800)]"
                aria-hidden
              />

              <div className="pl-[3px] pr-[3px]">
                <div className="flex w-fit flex-nowrap items-center justify-between gap-6">
                  <div className="flex h-9 w-fit max-w-full min-w-0 justify-start">
                    <div
                      className="hero-event__date-badge inline-flex h-9 max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-lg border border-[var(--ds-neutral-800)] bg-ds-neutral-800 py-1 pl-3 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50 sm:gap-2.5 sm:pl-3 sm:pr-3 sm:py-1 sm:text-[16px] sm:leading-tight"
                      role="group"
                      aria-label={`Event date${eventHasSpecificUtcTime(date) ? " and time" : ""}`}
                    >
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center sm:h-[22px] sm:w-[22px]">
                        <img
                          src="/icons/calendar.svg"
                          width={22}
                          height={22}
                          alt=""
                          aria-hidden
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="min-w-0 truncate font-sans">
                        {formatEventDateOnlyLong(date)}
                      </span>
                      {eventHasSpecificUtcTime(date) ? (
                        <>
                          <span
                            className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500 sm:h-4"
                            aria-hidden="true"
                          />
                          <span className="shrink-0 whitespace-nowrap font-sans">
                            {formatEventTimeUtcLabel(date)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <EventRarityScale value={event.rarity} />
                </div>
              </div>
            </div>

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
