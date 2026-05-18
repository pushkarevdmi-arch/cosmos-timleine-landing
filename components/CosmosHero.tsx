"use client";

import { useLocale } from "@/context/LocaleContext";
import BrandLogo from "./BrandLogo";
import LanguageSwitcher from "./LanguageSwitcher";

type CosmosHeroProps = {
  onLogoClick?: () => void;
};

export default function CosmosHero({ onLogoClick }: CosmosHeroProps) {
  const { t } = useLocale();

  return (
    <section
      className="relative w-full overflow-hidden bg-ds-neutral-1000"
      aria-label="Hero"
    >
      <div className="relative isolate flex h-svh max-h-[800px] w-full flex-col items-center justify-between gap-y-8 px-6 pt-6 pb-10 sm:max-h-none sm:gap-y-10 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 z-0">
          <video
            className="absolute inset-0 h-full min-h-full w-full object-cover"
            src="/videos/hero-video2.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          >
            {t("hero.videoUnsupported")}
          </video>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-ds-neutral-1000/50 to-transparent sm:h-36"
          aria-hidden
        />

        <div className="relative z-20 flex w-full items-center justify-between gap-4 self-stretch sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <button
            type="button"
            onClick={onLogoClick}
            className="flex cursor-pointer items-center gap-[7px] border-0 bg-transparent p-0 sm:col-start-2 sm:justify-self-center"
            aria-label={t("hero.reloadPage")}
          >
            <BrandLogo />
          </button>
          <div className="sm:col-start-3 sm:justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="relative z-10 flex w-full max-w-[72.875rem] flex-col items-center gap-1 px-1 text-center text-ds-neutral-00 mix-blend-difference">
          <h1 className="m-0 flex w-full flex-col items-center gap-1 pb-6 font-sans">
            <span className="block text-[clamp(1.625rem,4.2vw,2.5rem)] font-normal leading-[1] tracking-normal sm:leading-[40px]">
              {t("hero.titleLine1")}
            </span>
            <span className="block max-w-[1166px] text-[48px] font-normal leading-[1.05] tracking-normal sm:text-[clamp(2.125rem,8.5vw,5.5rem)] sm:leading-[80px]">
              {t("hero.titleLine2")}
              <br />
              {t("hero.titleLine3")}
            </span>
          </h1>
        </div>

        <p className="relative z-10 w-full min-w-0 max-w-full self-stretch px-[40px] text-center font-sans text-[16px] font-normal leading-6 text-ds-neutral-100 sm:text-[clamp(11px,3.4vw,18px)]">
          {t("hero.subtitle")}
        </p>
      </div>
    </section>
  );
}
