import type { ReactNode } from "react";

/**
 * Figures contract (dataviz skill): label in sentence case with no trailing
 * colon, value in the default proportional figures (not tabular — this is a
 * standalone display number, not a table column), an optional muted
 * sub-line for context (equivalence text, a date, etc).
 */
export function StatTile({
  label,
  value,
  sub,
  accent = "blue",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "blue" | "orange" | "aqua" | "yellow" | "magenta" | "green" | "violet" | "red";
}) {
  const accentClass: Record<string, string> = {
    blue: "text-series-blue",
    orange: "text-series-orange",
    aqua: "text-series-aqua",
    yellow: "text-series-yellow",
    magenta: "text-series-magenta",
    green: "text-series-green",
    violet: "text-series-violet",
    red: "text-series-red",
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-surface-raised/60 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className={`text-2xl font-semibold tracking-tight ${accentClass[accent]}`}>
        {value}
      </span>
      {sub ? <span className="text-xs text-text-secondary">{sub}</span> : null}
    </div>
  );
}
