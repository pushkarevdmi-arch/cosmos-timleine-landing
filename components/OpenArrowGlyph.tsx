/** Pixel arrow from `public/icons/arrow-open.svg`; `currentColor` for token-driven hover (e.g. `text-ds-text-brand`). */
export default function OpenArrowGlyph({
  clipId,
  className,
}: {
  clipId: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M10.1199 6.48306L8.64273 7.96026L7.16553 6.48306L8.64273 5.00586L10.1199 6.48306ZM10.1199 6.48306L11.5971 5.00586L13.0743 6.48306L11.5971 7.96026L10.1199 6.48306ZM13.0743 6.48306L14.5515 5.00586L16.0287 6.48306L14.5515 7.96026L13.0743 6.48306ZM16.0287 12.3919L17.5059 10.9147L18.9831 12.3919L17.5059 13.8691L16.0287 12.3919ZM16.0287 9.43747L17.5059 7.96026L18.9831 9.43747L17.5059 10.9147L16.0287 9.43747ZM16.0287 6.48306L17.5059 5.00586L18.9831 6.48306L17.5059 7.96026L16.0287 6.48306ZM16.0287 15.3463L17.5059 13.8691L18.9831 15.3463L17.5059 16.8235L16.0287 15.3463Z"
          fill="currentColor"
        />
        <rect
          x="5"
          y="17.502"
          width="17.6803"
          height="2.1187"
          transform="rotate(-45 5 17.502)"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(5 5)" />
        </clipPath>
      </defs>
    </svg>
  );
}
