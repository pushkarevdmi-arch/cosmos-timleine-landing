"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HeroEventData } from "./HeroEvent";

type Countdown = {
  years: number;
  days: number;
  hours: number;
  isPast: boolean;
};

function useCountdown(targetDate: string): Countdown {
  const getDiff = (): Countdown => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (Number.isNaN(target)) {
      return { years: 0, days: 0, hours: 0, isPast: false };
    }

    if (diff <= 0) {
      return { years: 0, days: 0, hours: 0, isPast: true };
    }

    const dayMs = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor(diff / dayMs);
    const years = Math.floor(totalDays / 365);
    const days = totalDays - years * 365;
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    return { years, days, hours, isPast: false };
  };

  const [countdown, setCountdown] = useState<Countdown>(getDiff);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getDiff());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

function formatCardDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export type EventCardProps = {
  event: HeroEventData;
};

export default function EventCard({ event }: EventCardProps) {
  const countdown = useCountdown(event.date);

  return (
    <article className="event-card">
      <div className="event-card__image-wrap">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="event-card__image"
        />
        <div className="event-card__category">Solar system</div>
      </div>

      <div className="event-card__content w-full">
        <div className="event-card__header">
          <h3 className="event-card__title">{event.title}</h3>
          <p className="event-card__description">{event.description}</p>
        </div>

        <div className="event-card__meta mt-6">
          <div className="flex flex-col gap-1">
            <div className="event-card__date">
              <span className="event-card__date-icon">
                <CalendarIcon className="h-3.5 w-3.5" />
              </span>
              <span>{formatCardDate(event.date)}</span>
            </div>

            <div className="event-card__countdown">
              {countdown.isPast ? (
                <p className="event-card__past-message">Event in the past</p>
              ) : (
                <div className="event-card__countdown-grid">
                  <div className="event-card__countdown-segment">
                    <span className="event-card__countdown-value">
                      {countdown.years.toString().padStart(2, "0")}
                    </span>
                    <span className="event-card__countdown-label">YEARS</span>
                  </div>
                  <div className="event-card__countdown-segment">
                    <span className="event-card__countdown-value">
                      {countdown.days.toString().padStart(3, "0")}
                    </span>
                    <span className="event-card__countdown-label">DAYS</span>
                  </div>
                  <div className="event-card__countdown-segment">
                    <span className="event-card__countdown-value">
                      {countdown.hours.toString().padStart(2, "0")}
                    </span>
                    <span className="event-card__countdown-label">HRS</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button type="button" className="event-card__explore">
            <span className="event-card__explore-icon">
              <img src="/icons/rocket.svg" width="18" height="18" />
            </span>
            <span className="text-sm font-medium leading-[22px]">
              Explore event
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

