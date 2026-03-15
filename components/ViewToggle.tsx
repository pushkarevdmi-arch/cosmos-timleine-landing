"use client";

type ViewMode = "grid" | "timeline";

type ViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-zinc-900/80 p-1 ring-1 ring-zinc-700/70 backdrop-blur">
      {[
        { value: "grid" as ViewMode, label: "Grid" },
        { value: "timeline" as ViewMode, label: "Timeline" },
      ].map((option) => {
        const isActive = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "relative px-4 py-1.5 text-xs font-medium transition-colors rounded-full",
              isActive
                ? "bg-zinc-100 text-black shadow-sm"
                : "text-zinc-400 hover:text-zinc-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

