"use client";

import { TIME_RANGE_PRESETS } from "@/types/api";
import { formatRangeLabel } from "@/lib/format";
import { useTimeRange } from "@/lib/time-range-context";

/**
 * The one shared filter row (ticket 06) — every section below scopes its
 * fetch to this preset, so the numbers across the dashboard always agree.
 */
export function TimeRangeSelector() {
  const { range, setRange } = useTimeRange();

  return (
    <div
      role="radiogroup"
      aria-label="Time range"
      className="inline-flex flex-wrap gap-1 rounded-full border border-white/10 bg-surface-raised/70 p-1"
    >
      {TIME_RANGE_PRESETS.map((preset) => {
        const active = preset === range;
        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setRange(preset)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-series-blue text-white shadow-sm"
                : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
            }`}
          >
            {formatRangeLabel(preset)}
          </button>
        );
      })}
    </div>
  );
}
