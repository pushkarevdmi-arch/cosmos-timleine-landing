"use client";

export type EventExtraTag = {
  type: "rarity" | "location";
  label: string;
  icon?: string;
};

type EventTagGroupProps = {
  primaryTag?: string;
  specialTags?: EventExtraTag[];
};

function getLocationAbbreviation(label: string, icon?: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized === "europe") return "EU";
  if (normalized === "asia") return "AS";
  if (normalized === "north america") return "NA";

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
    <div className="event-card__badge-row">
      <div className="event-card__category">{primaryTag}</div>
      {specialTags.map((tag) => {
        // Skip location tags that describe multiple broad regions (e.g. "Europe, Africa, W. Asia"),
        // but keep specific curated ones like "Pacific & North America" on the card.
        if (tag.type === "location") {
          const normalizedLabel = tag.label.trim().toLowerCase();
          const isCuratedMultiRegion =
            normalizedLabel === "pacific & north america" ||
            normalizedLabel === "pacific, north america";

          if (!isCuratedMultiRegion && (tag.label.includes(",") || tag.label.includes("&"))) {
            return null;
          }
        }

        return (
          <div
            key={`${tag.type}-${tag.label}`}
            className={[
              "event-card__extra-tag",
              `event-card__extra-tag--${tag.type}`,
              tag.type === "location"
                ? "event-card__extra-tag--with-icon"
                : "event-card__extra-tag--no-icon",
            ].join(" ")}
          >
            {tag.type === "location" ? (
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
            ) : null}
            <span>{tag.label}</span>
          </div>
        );
      })}
    </div>
  );
}
