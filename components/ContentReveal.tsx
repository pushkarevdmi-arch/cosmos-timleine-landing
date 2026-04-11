"use client";

import { useEffect, useMemo, useState } from "react";
import { PRELOADER_EXIT_EVENT } from "./NumericPreloader";

export default function ContentReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reveal, setReveal] = useState(false);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    const onExit = () => setReveal(true);
    window.addEventListener(PRELOADER_EXIT_EVENT, onExit);
    return () => window.removeEventListener(PRELOADER_EXIT_EVENT, onExit);
  }, []);

  return (
    <div
      className={
        reveal && !reducedMotion ? "cosmos-content-reveal min-h-screen" : "min-h-screen"
      }
    >
      {children}
    </div>
  );
}
