"use client";

import { useLocale } from "@/context/LocaleContext";
import {
  eventHasSpecificUtcTime,
  formatEventDateOnlyLong,
  formatEventTimeUtcLabel,
} from "@/utils/eventDate";

type EventDateBadgeProps = {
  date: string;
};

export default function EventDateBadge({ date }: EventDateBadgeProps) {
  const { locale, t } = useLocale();
  const dateAria = eventHasSpecificUtcTime(date)
    ? t("heroEvent.eventDateAndTimeAria")
    : t("heroEvent.eventDateAria");

  return (
    <div className="flex h-fit w-fit max-w-full min-w-0 justify-start">
      <div
        className="hero-event__date-badge inline-flex h-fit max-w-full min-w-0 flex-nowrap items-center gap-2 rounded-[12px] border border-[var(--ds-neutral-800)] bg-[var(--ds-neutral-700)] py-1 pl-1 pr-3 font-sans text-[14px] font-normal leading-tight tracking-normal text-ds-neutral-50 sm:gap-2.5 sm:pl-1 sm:pr-3 sm:py-1 sm:text-[16px] sm:leading-tight"
        role="group"
        aria-label={dateAria}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-ds-neutral-950"
          aria-hidden
        >
          <span
            className="inline-block h-4 w-4 shrink-0 bg-ds-warning-500 [mask-image:url('/icons/calendar1.svg')] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-image:url('/icons/calendar1.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]"
            aria-hidden
          />
        </span>
        <span className="min-w-0 truncate font-sans text-[14px] font-medium sm:text-[16px]">
          {formatEventDateOnlyLong(date, locale)}
        </span>
        {eventHasSpecificUtcTime(date) ? (
          <>
            <span
              className="h-3.5 w-px shrink-0 self-center bg-ds-neutral-500 sm:h-4"
              aria-hidden="true"
            />
            <span className="shrink-0 whitespace-nowrap font-sans text-[14px] font-medium sm:text-[16px]">
              {formatEventTimeUtcLabel(date, locale)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
