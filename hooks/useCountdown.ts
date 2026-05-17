"use client";

import { useEffect, useState } from "react";
import { getCountdownBreakdown } from "@/utils/eventDate";

export type Countdown = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function breakdownToCountdown(targetDate: string): Countdown {
  const b = getCountdownBreakdown(targetDate);
  return {
    years: b.years,
    days: b.days,
    hours: b.hours,
    minutes: b.minutes,
    seconds: b.seconds,
    isPast: b.isPast,
  };
}

/** Live countdown; recalculates immediately when `targetDate` changes, then every second. */
export function useCountdown(targetDate: string): Countdown {
  const [countdown, setCountdown] = useState(() =>
    breakdownToCountdown(targetDate)
  );

  useEffect(() => {
    setCountdown(breakdownToCountdown(targetDate));

    const interval = setInterval(() => {
      setCountdown(breakdownToCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}
