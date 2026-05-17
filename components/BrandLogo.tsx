import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
};

const SIZES = {
  sm: {
    mark: 17,
    gap: "gap-[7px]",
    text: "text-[15px] leading-[23px]",
  },
  md: {
    mark: 24,
    gap: "gap-2",
    text: "text-lg leading-7",
  },
} as const;

export default function BrandLogo({
  className,
  size = "sm",
  "aria-label": ariaLabel,
}: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <span
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      className={["inline-flex items-center", s.gap, className]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/images/figma-hero/logo-mark.svg"
        alt=""
        width={s.mark}
        height={s.mark}
        className="block shrink-0 rotate-90"
      />
      <span
        className={[
          "whitespace-nowrap font-sans font-medium tracking-[-0.15px] text-ds-neutral-00",
          s.text,
        ].join(" ")}
      >
        COSMORROW
      </span>
    </span>
  );
}
