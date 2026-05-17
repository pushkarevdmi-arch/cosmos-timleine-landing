"use client";

export type EventExtraTag = {
  type: "location";
  label: string;
  icon?: string;
};

type EventTagGroupProps = {
  primaryTag?: string;
  specialTags?: EventExtraTag[];
};

/** `public/icons/galactic-deep-time.svg` — galactic / deep-time scale events. */
const GALACTIC_DEEP_TIME_ICON = "/icons/galactic-deep-time.svg";

/** Conjunction + planetary categories use `public/icons/Conjunction 1.svg` (space → %20 in URL). */
const CONJUNCTION_PLANETARY_ICON = "/icons/Conjunction%201.svg";

/** Display tag (EN in `data/events/*.json`, RU in `*-ru.json`) → `/public/icons/…`. */
const CATEGORY_ICON_SRC: Record<string, string> = {
  Conjunction: CONJUNCTION_PLANETARY_ICON,
  "Planetary Event": CONJUNCTION_PLANETARY_ICON,
  Eclipse: "/icons/eclipse-shadow.svg",
  Transit: "/icons/transit-silhouette.svg",
  Comet: "/icons/small-body-trail.svg",
  Asteroid: "/icons/small-body-trail.svg",
  "Meteor Shower": "/icons/small-body-trail.svg",
  "Lunar Event": "/icons/lunar-cycle.svg",
  "Stellar Event": "/icons/stellar-burst.svg",
  "Stellar Encounter": "/icons/stellar-burst.svg",
  Supernova: "/icons/stellar-burst.svg",
  "Galactic Event": GALACTIC_DEEP_TIME_ICON,
  "Cosmic Event": GALACTIC_DEEP_TIME_ICON,
  "Solar system": "/icons/observation-default.svg",
  // Russian (`data/events/*-ru.json`)
  Соединение: CONJUNCTION_PLANETARY_ICON,
  "Планетное событие": CONJUNCTION_PLANETARY_ICON,
  "Планетарное событие": CONJUNCTION_PLANETARY_ICON,
  Затмение: "/icons/eclipse-shadow.svg",
  Прохождение: "/icons/transit-silhouette.svg",
  Комета: "/icons/small-body-trail.svg",
  Астероид: "/icons/small-body-trail.svg",
  "Метеорный дождь": "/icons/small-body-trail.svg",
  "Лунное событие": "/icons/lunar-cycle.svg",
  "Звёздное событие": "/icons/stellar-burst.svg",
  "Звёздное сближение": "/icons/stellar-burst.svg",
  Сверхновая: "/icons/stellar-burst.svg",
  "Галактическое событие": GALACTIC_DEEP_TIME_ICON,
  "Космическое событие": GALACTIC_DEEP_TIME_ICON,
};

const DEFAULT_CATEGORY_ICON = "/icons/observation-default.svg";

function getCategoryIconSrc(primaryTag: string): string {
  const key = Object.keys(CATEGORY_ICON_SRC).find(
    (k) => k.toLowerCase() === primaryTag.trim().toLowerCase(),
  );
  return key ? CATEGORY_ICON_SRC[key]! : DEFAULT_CATEGORY_ICON;
}

/** Single observation-type pill (matches card/hero category styling). */
export function EventCategoryTag({
  primaryTag = "Solar system",
  className = "",
}: {
  primaryTag?: string;
  className?: string;
}) {
  const label = primaryTag?.trim() ? primaryTag : "Solar system";
  const categoryIconSrc = getCategoryIconSrc(label);

  return (
    <div
      className={`event-card__category shrink-0 ${className}`.trim()}
      aria-label={`Event type: ${label}`}
    >
      <img
        src={categoryIconSrc}
        width={16}
        height={16}
        alt=""
        aria-hidden
        className="event-card__category-icon"
      />
      {label}
    </div>
  );
}

function getLocationAbbreviation(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized === "europe" || normalized === "европа") return "EU";
  if (normalized === "asia" || normalized === "азия") return "AS";
  if (normalized === "north america" || normalized === "северная америка") return "NA";

  return label
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export default function EventTagGroup({
  primaryTag = "Solar system",
  specialTags = [],
}: EventTagGroupProps) {
  return (
    <div className="event-tag-group event-card__badge-row">
      <EventCategoryTag primaryTag={primaryTag} />
      {specialTags.map((tag) => {
        // Skip location tags that describe multiple broad regions (e.g. "Europe, Africa, W. Asia"),
        // but keep specific curated ones like "Pacific & North America" on the card.
        const normalizedLabel = tag.label.trim().toLowerCase();
        const isCuratedMultiRegion =
          normalizedLabel === "pacific & north america" ||
          normalizedLabel === "pacific, north america";

        if (!isCuratedMultiRegion && (tag.label.includes(",") || tag.label.includes("&"))) {
          return null;
        }

        return (
          <div
            key={`${tag.type}-${tag.label}`}
            className="event-card__extra-tag event-card__extra-tag--location event-card__extra-tag--with-icon"
          >
            <span className="event-card__extra-tag-icon" aria-hidden="true">
              {tag.icon ? (
                <img
                  src={`/icons/flags/${tag.icon}.svg`}
                  width={20}
                  height={20}
                  alt={tag.label}
                />
              ) : (
                getLocationAbbreviation(tag.label)
              )}
            </span>
            <span className="event-card__extra-tag-label" title={tag.label}>
              {tag.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
