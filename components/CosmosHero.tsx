"use client";

import Image from "next/image";

type CosmosHeroProps = {
  onLogoClick?: () => void;
};

export default function CosmosHero({ onLogoClick }: CosmosHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-ds-neutral-1000"
      aria-label="Hero"
    >
      <div className="relative isolate flex h-svh w-full flex-col items-center justify-between gap-y-8 px-6 py-10 sm:gap-y-10 sm:px-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0 z-0">
          <video
            className="absolute inset-0 h-full min-h-full w-full object-cover"
            src="/videos/hero-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="relative z-10 flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={onLogoClick}
            className="flex cursor-pointer items-center gap-[7px] border-0 bg-transparent p-0"
            aria-label="Reload page"
          >
            <span className="relative flex size-[17px] shrink-0 items-center justify-center">
              <Image
                src="/images/figma-hero/logo-mark.svg"
                alt=""
                width={17}
                height={17}
                className="block rotate-90"
              />
            </span>
            <span className="whitespace-nowrap font-sans text-[15px] font-medium leading-[23px] tracking-[-0.15px] text-ds-neutral-00">
              COSMORROW
            </span>
          </button>
        </div>

        <div className="relative z-10 flex w-full max-w-[72.875rem] flex-col items-center gap-1 px-1 text-center text-ds-neutral-00 mix-blend-difference">
          <h1 className="m-0 flex w-full flex-col items-center gap-1 font-sans">
            <span className="block text-[clamp(1.625rem,4.2vw,2.5rem)] font-normal leading-[1] tracking-normal sm:leading-[40px]">
              Journey Into
            </span>
            <span className="block max-w-[1166px] text-[clamp(2.125rem,8.5vw,5.5rem)] font-medium leading-[1.05] tracking-normal sm:leading-[80px]">
              the Future of
              <br />
              the Universe
            </span>
          </h1>
        </div>

        <p className="relative z-10 max-w-none whitespace-nowrap px-2 text-center font-sans text-[clamp(11px,3.4vw,18px)] font-normal leading-6 text-ds-neutral-100">
          From our lifetime to the final moments of the cosmos.
        </p>
      </div>
    </section>
  );
}
