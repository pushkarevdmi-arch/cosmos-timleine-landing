"use client";

import { useEffect, useMemo, useState } from "react";

export const PRELOADER_EXIT_EVENT = "cosmos-preloader-exit-start";

const pad2 = (n: number) => n.toString().padStart(2, "0");

function splitHms(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
}

type NumericPreloaderProps = {
  /**
   * Длительность «открутки» таймера от 00:01:59 к 00:00:00 (мс), как раньше у полосы 0→100%.
   */
  rampUpMs?: number;
  /**
   * Максимальное время (мс), после которого считаем загрузку завершённой, если `load` не пришёл.
   */
  maxWaitMs?: number;
  /**
   * Стартовое значение обратного отсчёта в секундах (119 = 00:01:59).
   */
  initialSeconds?: number;
};

export default function NumericPreloader({
  rampUpMs = 2000,
  maxWaitMs = 2000,
  initialSeconds = 119,
}: NumericPreloaderProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [remainingSec, setRemainingSec] = useState(initialSeconds);
  const [animationDone, setAnimationDone] = useState(false);
  const [loadDone, setLoadDone] = useState(false);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    const exitAfterMs = 320;

    if (!isExiting) return;
    window.dispatchEvent(new CustomEvent(PRELOADER_EXIT_EVENT));
    const t = window.setTimeout(() => setShouldRender(false), exitAfterMs);
    return () => window.clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!loadDone || !animationDone) return;
    const t = window.setTimeout(() => setIsExiting(true), 0);
    return () => window.clearTimeout(t);
  }, [animationDone, loadDone]);

  useEffect(() => {
    if (reducedMotion) {
      let loadDoneTimeout: number | undefined;
      const t = window.setTimeout(() => {
        setRemainingSec(0);
        setAnimationDone(true);
        loadDoneTimeout = window.setTimeout(() => {
          setLoadDone(true);
        }, 50);
      }, 0);
      return () => {
        window.clearTimeout(t);
        if (loadDoneTimeout) window.clearTimeout(loadDoneTimeout);
      };
    }

    let fallbackId: number | null = null;
    let rafId: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const frameStart = window.performance?.now?.() ?? Date.now();
    const animate = (now: number) => {
      const elapsedMs = now - frameStart;
      const ratio = Math.min(1, elapsedMs / rampUpMs);
      const eased = easeOutCubic(ratio);
      const nextSec = Math.max(
        0,
        Math.min(initialSeconds, Math.floor(initialSeconds * (1 - eased))),
      );
      setRemainingSec(nextSec);

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
    fallbackId = window.setTimeout(() => handleLoad(), maxWaitMs);

    if (document.readyState === "complete") handleLoad();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (fallbackId) window.clearTimeout(fallbackId);
      window.removeEventListener("load", handleLoad);
    };
  }, [initialSeconds, maxWaitMs, rampUpMs, reducedMotion]);

  if (!shouldRender) return null;

  const { h, m, s } = splitHms(remainingSec);

  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      role="progressbar"
      aria-valuenow={initialSeconds - remainingSec}
      aria-valuemin={0}
      aria-valuemax={initialSeconds}
      className={`flex items-center justify-center text-white transition-opacity duration-300 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        minHeight: "100dvh",
        margin: 0,
        backgroundColor: "#000000",
        zIndex: 2147483646,
      }}
    >
      <div
        className="inline-flex items-baseline gap-x-2 font-departure-mono tabular-nums text-[clamp(1.625rem,7vw,3.375rem)] leading-none tracking-wide [font-variant-numeric:slashed-zero]"
        aria-hidden="true"
      >
        <span className="text-white">{pad2(h)}</span>
        <span className="px-1 text-ds-neutral-400">:</span>
        <span className="text-white">{pad2(m)}</span>
        <span className="px-1 text-ds-neutral-400">:</span>
        <span className="text-white">{pad2(s)}</span>
      </div>
    </div>
  );
}
