"use client";

import { useEffect, useMemo, useState } from "react";

type NumericPreloaderProps = {
  /**
   * Длительность анимации от `0%` до `100%` (мс).
   */
  rampUpMs?: number;
  /**
   * Максимальное время (мс), после которого прелоадер всё равно спрячется (защита от зависаний).
   */
  maxWaitMs?: number;
};

export default function NumericPreloader({
  rampUpMs = 4000,
  maxWaitMs = 8000,
}: NumericPreloaderProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [loadDone, setLoadDone] = useState(false);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    const exitAfterMs = 200;

    if (!isExiting) return;
    const t = window.setTimeout(() => setShouldRender(false), exitAfterMs);
    return () => window.clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!loadDone || !animationDone) return;
    setIsExiting(true);
  }, [animationDone, loadDone]);

  useEffect(() => {
    if (reducedMotion) {
      // При reduced motion просто быстро покажем 100% и скроем.
      setProgress(100);
      setAnimationDone(true);
      const t = window.setTimeout(() => {
        setLoadDone(true);
      }, 50);
      return () => window.clearTimeout(t);
    }

    const startedAt = Date.now();
    let fallbackId: number | null = null;
    let rafId: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const frameStart = window.performance?.now?.() ?? Date.now();
    const animate = (now: number) => {
      const elapsedMs = now - frameStart;
      const ratio = Math.min(1, elapsedMs / rampUpMs);
      const eased = easeOutCubic(ratio);
      const next = Math.max(0, Math.min(100, Math.round(eased * 100)));
      setProgress(next);

      if (ratio >= 1) {
        setAnimationDone(true);
        return;
      }

      rafId = window.requestAnimationFrame(animate);
    };
    rafId = window.requestAnimationFrame((now) => animate(now));

    const handleLoad = () => {
      setLoadDone(true);
      if (fallbackId) window.clearTimeout(fallbackId);
    };

    window.addEventListener("load", handleLoad, { once: true });

    // Если `load` по какой-то причине не сработает, всё равно уберём оверлей.
    fallbackId = window.setTimeout(() => handleLoad(), maxWaitMs);

    if (document.readyState === "complete") handleLoad();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (fallbackId) window.clearTimeout(fallbackId);
      window.removeEventListener("load", handleLoad);
    };
  }, [maxWaitMs, rampUpMs, reducedMotion]);

  if (!shouldRender) return null;

  return (
    <div
      aria-label="Loading"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-ds-neutral-1000 text-ds-neutral-50 transition-opacity duration-200 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="tabular-nums font-dynamite text-[64px] leading-[64px]">
        {progress}%
      </div>
    </div>
  );
}

