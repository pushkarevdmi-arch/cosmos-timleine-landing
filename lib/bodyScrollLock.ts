/**
 * Reference-counted body scroll lock for modals/overlays.
 * Mobile Safari reports window.scrollY as 0 while body is position:fixed — we keep a
 * last-known snapshot from page scroll and restore before paint on unlock.
 */

let lockCount = 0;
/** Scroll offset when the current lock stack started. */
let savedScrollY = 0;
/** Last reliable scroll position while the page was scrollable. */
let lastKnownScrollY = 0;
/** Set during unlock until scroll restoration finishes. */
let pendingRestoreY: number | null = null;

function getWindowScrollY(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/** Keep in sync from the page scroll listener while no modal is open. */
export function syncScrollSnapshot(): void {
  if (typeof window === "undefined") return;
  if (lockCount > 0) return;

  const y = getWindowScrollY();
  if (y > 0 || lastKnownScrollY === 0) {
    lastKnownScrollY = y;
  }
}

function readScrollPosition(): number {
  if (typeof window === "undefined") return 0;

  const body = document.body;
  if (body.style.position === "fixed" && body.style.top) {
    const parsed = parseInt(body.style.top, 10);
    if (!Number.isNaN(parsed)) {
      return Math.abs(parsed);
    }
  }

  if (pendingRestoreY !== null) {
    return pendingRestoreY;
  }

  const y = getWindowScrollY();
  if (y > 0) {
    lastKnownScrollY = y;
    return y;
  }

  if (lastKnownScrollY > 0) {
    return lastKnownScrollY;
  }

  return 0;
}

function applyLock(scrollY: number) {
  const html = document.documentElement;
  const body = document.body;
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
}

function scrollToY(y: number) {
  const html = document.documentElement;
  const body = document.body;
  html.scrollTop = y;
  body.scrollTop = y;
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

function restoreScrollPosition(scrollY: number) {
  const html = document.documentElement;
  const body = document.body;

  let y = scrollY;
  if (body.style.position === "fixed" && body.style.top) {
    const fromTop = Math.abs(parseInt(body.style.top, 10));
    if (!Number.isNaN(fromTop)) {
      y = fromTop;
    }
  }
  savedScrollY = y;
  pendingRestoreY = y;
  lastKnownScrollY = y;

  // Keep overflow clipped until scroll is applied so Safari does not paint at y=0.
  html.style.overflow = "hidden";

  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.paddingRight = "";

  scrollToY(y);

  requestAnimationFrame(() => {
    if (Math.abs(getWindowScrollY() - y) > 2) {
      scrollToY(y);
    }
    html.style.overflow = "";
    lastKnownScrollY = y;
    pendingRestoreY = null;
  });
}

/** Call immediately before opening a modal (before React state updates). */
export function captureScrollPositionForModal(): void {
  syncScrollSnapshot();
  const y = readScrollPosition();
  savedScrollY = y;
  lastKnownScrollY = y;
  if (lockCount > 0) {
    applyLock(y);
  }
}

/** Lock document body scroll; call returned function to release. */
export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    const y = readScrollPosition();
    savedScrollY = y;
    lastKnownScrollY = y;
    applyLock(savedScrollY);
  }
  lockCount += 1;

  return () => {
    if (lockCount <= 0) return;
    lockCount -= 1;
    if (lockCount === 0) {
      restoreScrollPosition(savedScrollY);
    }
  };
}
