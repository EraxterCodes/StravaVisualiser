"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { TimeRangePreset } from "@/types/api";

interface TimeRangeContextValue {
  range: TimeRangePreset;
  setRange: (range: TimeRangePreset) => void;
}

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

/**
 * Owns the single time-range preset shared by every visualisation on the
 * dashboard (ticket 06). Changing it re-scopes stats, heatmap, trends, and
 * the activities list in one place, so the numbers always agree.
 */
export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<TimeRangePreset>("all-time");

  const value = useMemo(() => ({ range, setRange }), [range]);

  return (
    <TimeRangeContext.Provider value={value}>{children}</TimeRangeContext.Provider>
  );
}

export function useTimeRange(): TimeRangeContextValue {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return ctx;
}
