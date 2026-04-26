"use client";

type ViewMode = "grid" | "timeline";

type ViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const options = [{ value: "grid" as ViewMode }, { value: "timeline" as ViewMode }];

  return (
    <div className="flex w-[180px] gap-1.5 rounded-2xl bg-ds-neutral-900 p-1 sm:inline-flex sm:w-auto sm:p-1.5">
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
              "relative flex h-12 min-w-0 flex-1 appearance-none items-center justify-center rounded-xl border-0 cursor-pointer sm:flex-none sm:w-12",
              "transition-[background-color,box-shadow,color] duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
              isActive
                ? "text-ds-neutral-100"
                : "text-ds-neutral-500 hover:text-ds-neutral-400",
            ].join(" ")}
            style={{
              backgroundColor: isActive ? "var(--ds-neutral-700)" : "transparent",
              boxShadow: isActive
                ? "inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 16px 22px 0 rgba(0, 0, 0, 0.4)"
                : "none",
            }}
          >
            {option.value === "grid" ? (
              <span
                aria-hidden="true"
                className="size-6 bg-current transition-colors duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
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
                className="size-6 bg-current transition-colors duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
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

