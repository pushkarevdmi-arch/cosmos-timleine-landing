"use client";

type ViewMode = "grid" | "timeline";

type ViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const options = [{ value: "grid" as ViewMode }, { value: "timeline" as ViewMode }];

  return (
    <div
      className="inline-flex rounded-2xl p-1.5"
      style={{
        backgroundColor: "var(--ds-neutral-900)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--ds-neutral-800)",
      }}
    >
      {options.map((option) => {
        const isActive = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!isActive) onChange(option.value);
            }}
            aria-pressed={isActive}
            aria-label={option.value === "grid" ? "Grid view" : "Timeline view"}
            className={[
              "relative flex h-12 w-12 appearance-none items-center justify-center rounded-xl border-0 transition-colors cursor-pointer",
              isActive
                ? "text-ds-neutral-100"
                : "text-ds-neutral-500 hover:text-ds-neutral-400",
            ].join(" ")}
            style={{
              backgroundColor: isActive ? "var(--ds-neutral-700)" : "transparent",
            }}
          >
            {option.value === "grid" ? (
              <span
                aria-hidden="true"
                className="size-6 bg-current"
                style={{
                  color: isActive ? "var(--ds-neutral-00)" : undefined,
                  WebkitMaskImage: "url('/icons/view-grid.svg')",
                  maskImage: "url('/icons/view-grid.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "24px 24px",
                  maskSize: "24px 24px",
                }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="size-6 bg-current"
                style={{
                  color: isActive ? "var(--ds-neutral-00)" : undefined,
                  WebkitMaskImage: "url('/icons/view-timeline.svg')",
                  maskImage: "url('/icons/view-timeline.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "24px 24px",
                  maskSize: "24px 24px",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

