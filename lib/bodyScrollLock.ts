/**
 * Reference-counted body scroll lock for modals/overlays.
 * Mobile: overflow-only lock (scroll position stays natural — no restore flash).
 * Desktop: position:fixed lock with snapshot restore.
 */

const MOBILE_SCROLL_LOCK_MQ = "(max-width: 639px)";

let lockCount = 0;
let lockMode: "overflow" | "fixed" | null = null;
/** Scroll offset when the current fixed lock started. */
let savedScrollY = 0;
/** Last reliable scroll position while the page was scrollable. */
let lastKnownScrollY = 0;

function isOverflowOnlyLock(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_SCROLL_LOCK_MQ).matches;
}

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
  if (lockMode === "fixed" && body.style.position === "fixed" && body.style.top) {
    const parsed = parseInt(body.style.top, 10);
    if (!Number.isNaN(parsed)) {
      return Math.abs(parsed);
    }
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

function applyOverflowLock() {
  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.touchAction = "none";
}

function releaseOverflowLock() {
  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = "";
  html.style.overscrollBehavior = "";
  body.style.overflow = "";
  body.style.overscrollBehavior = "";
  body.style.touchAction = "";
}

function applyFixedLock(scrollY: number) {
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

function restoreFixedScrollPosition(scrollY: number) {
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
  lastKnownScrollY = y;

  html.style.overflow = "hidden";

  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.paddingRight = "";

  scrollToY(y);
  html.style.overflow = "";
}

function releaseLock() {
  if (lockMode === "overflow") {
    releaseOverflowLock();
  } else if (lockMode === "fixed") {
    restoreFixedScrollPosition(savedScrollY);
  }
  lockMode = null;
}

/** Call immediately before opening a modal (before React state updates). */
export function captureScrollPositionForModal(): void {
  syncScrollSnapshot();
  const y = readScrollPosition();
  savedScrollY = y;
  lastKnownScrollY = y;
  if (lockCount > 0 && lockMode === "fixed") {
    applyFixedLock(y);
  }
}

/** Lock document body scroll; call returned function to release. */
export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    const y = readScrollPosition();
    savedScrollY = y;
    lastKnownScrollY = y;

    if (isOverflowOnlyLock()) {
      lockMode = "overflow";
      applyOverflowLock();
    } else {
      lockMode = "fixed";
      applyFixedLock(savedScrollY);
    }
  }
  lockCount += 1;

  return () => {
    if (lockCount <= 0) return;
    lockCount -= 1;
    if (lockCount === 0) {
      releaseLock();
    }
  };
}

/**
 * Release fixed-position lock at the start of the close animation (backdrop still visible).
 */
export function releaseBodyScrollLockIfFixed(): void {
  if (lockCount <= 0 || lockMode !== "fixed") return;
  lockCount = 0;
  releaseLock();
}

/** Release any remaining lock when the modal unmounts (overflow lock on mobile). */
export function releaseBodyScrollLock(): void {
  if (lockCount <= 0) return;
  lockCount = 0;
  releaseLock();
}
