"use client";

export type EventExtraTag = {
  kind: "rarity" | "location";
  label: string;
  icon?: string;
};

type EventTagGroupProps = {
  primaryTag?: string;
  extraTags?: EventExtraTag[];
};

function getLocationAbbreviation(label: string, icon?: string) {
  if (icon) return icon.toUpperCase();

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
  extraTags = [],
}: EventTagGroupProps) {
  const visibleExtraTags = extraTags.filter((tag) => tag.kind !== "location");

  return (
    <div className="event-card__badge-row">
      <div className="event-card__category">{primaryTag}</div>
      {visibleExtraTags.map((tag) => (
        <div
          key={`${tag.kind}-${tag.label}`}
          className={`event-card__extra-tag event-card__extra-tag--${tag.kind}`}
        >
          {tag.kind === "location" ? (
            <span className="event-card__extra-tag-icon" aria-hidden="true">
              {getLocationAbbreviation(tag.label, tag.icon)}
            </span>
          ) : null}
          <span>{tag.label}</span>
        </div>
      ))}
    </div>
  );
}
