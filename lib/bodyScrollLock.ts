/**
 * Reference-counted body scroll lock for modals/overlays.
 * Mobile Safari reports window.scrollY as 0 while body is position:fixed — we persist
 * the locked offset and reuse it across rapid open/close or modal-to-modal swaps.
 */

let lockCount = 0;
let savedScrollY = 0;
/** Set during unlock until scroll restoration finishes (covers A→B modal swap in one frame). */
let pendingRestoreY: number | null = null;

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

  return window.scrollY;
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

function releaseLock(scrollY: number) {
  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.paddingRight = "";

  pendingRestoreY = scrollY;

  const restore = () => {
    window.scrollTo(0, scrollY);
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - scrollY) > 2) {
        window.scrollTo(0, scrollY);
      }
      pendingRestoreY = null;
    });
  };

  requestAnimationFrame(restore);
}

/** Call when opening a modal so scroll is captured at tap time (before mount). */
export function captureScrollPositionForModal(): void {
  savedScrollY = readScrollPosition();
}

/** Lock document body scroll; call returned function to release. */
export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    savedScrollY = readScrollPosition();
    applyLock(savedScrollY);
  }
  lockCount += 1;

  return () => {
    if (lockCount <= 0) return;
    lockCount -= 1;
    if (lockCount === 0) {
      releaseLock(savedScrollY);
    }
  };
}
