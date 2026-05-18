"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n";

const options: Locale[] = ["en", "ru"];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const selectLocale = (code: Locale) => {
    setLocale(code);
    close();
  };

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        type="button"
        aria-label={t("language.switcherLabel")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-0.5 rounded-lg bg-[var(--app-card-surface)] py-2 pl-3 pr-1.5 font-sans text-[14px] font-normal leading-5 text-ds-neutral-00 transition-colors sm:h-10 sm:min-w-[5rem] sm:gap-1 sm:rounded-[12px] sm:py-2 sm:pl-3 sm:pr-2 sm:text-[16px] sm:leading-6"
      >
        <span className="whitespace-nowrap text-ds-neutral-200">
          {t(`language.${locale}`)}
        </span>
        <span
          aria-hidden
          className={[
            "size-5 shrink-0 bg-ds-neutral-400 transition-transform duration-200 sm:size-6",
            "[-webkit-mask-size:20px_20px] [mask-size:20px_20px]",
            "sm:[-webkit-mask-size:24px_24px] sm:[mask-size:24px_24px]",
            open ? "rotate-180" : "",
          ].join(" ")}
          style={{
            WebkitMaskImage: "url('/icons/weui_arrow-outlined.svg')",
            maskImage: "url('/icons/weui_arrow-outlined.svg')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("language.switcherLabel")}
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-full overflow-hidden rounded-xl border border-ds-neutral-700 bg-ds-neutral-900 p-1 shadow-lg backdrop-blur"
        >
          {options.map((code) => {
            const selected = locale === code;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectLocale(code)}
                  className={[
                    "flex h-9 w-full cursor-pointer items-center rounded-lg px-2.5 text-left font-sans text-[14px] font-normal leading-5 transition-colors sm:h-10 sm:px-3 sm:text-[16px] sm:leading-6",
                    selected
                      ? "bg-ds-neutral-700 text-ds-neutral-00"
                      : "text-ds-neutral-200 hover:bg-ds-neutral-800",
                  ].join(" ")}
                >
                  {t(`language.${code}`)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
