"use client";

import { useLocale } from "@/context/LocaleContext";
import type { EventRarity } from "./HeroEvent";

function clampRarity(value: number | undefined): EventRarity {
  if (value == null || Number.isNaN(value)) return 3;
  const rounded = Math.round(value);
  return Math.min(5, Math.max(1, rounded)) as EventRarity;
}

type EventRarityScaleProps = {
  value: EventRarity | number | undefined;
};

export default function EventRarityScale({ value }: EventRarityScaleProps) {
  const { t } = useLocale();
  const r = clampRarity(value);

  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      role="group"
      aria-label={t("modal.rarityAria", { value: r })}
    >
      <p className="whitespace-nowrap font-sans text-[16px] leading-6 text-ds-neutral-00">
        {t("modal.rarity")}
      </p>
      <div className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`h-6 w-1 shrink-0 rounded ${
              i < r ? "bg-ds-primary-500" : "bg-ds-neutral-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
