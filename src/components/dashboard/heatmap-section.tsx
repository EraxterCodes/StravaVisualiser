"use client";

import { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Card, SectionHeading } from "@/components/dashboard/card";
import { formatDate, formatDistanceKm } from "@/lib/format";
import { useTimeRange } from "@/lib/time-range-context";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { HeatmapResponse, TimeRangePreset } from "@/types/api";

const SEQUENTIAL_LEVELS = 5;

function presetStart(range: TimeRangePreset, today: Date): Date {
  const start = new Date(today);
  switch (range) {
    case "this-year":
      start.setUTCMonth(0, 1);
      break;
    case "this-month":
      start.setUTCDate(1);
      break;
    case "last-30-days":
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case "all-time":
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      break;
  }
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function HeatmapSection() {
  const { range } = useTimeRange();
  const { data, loading, error } = useFetchJson<HeatmapResponse>(
    `/api/heatmap?range=${range}`,
  );

  const today = useMemo(() => new Date(), []);

  const { start, end, byDate, maxDistance } = useMemo(() => {
    const entries = data ?? [];
    const byDate = new Map(entries.map((e) => [e.date, e.distanceMeters]));
    const maxDistance = entries.reduce((m, e) => Math.max(m, e.distanceMeters), 0);

    let start: Date;
    if (range === "all-time" && entries.length > 0) {
      start = new Date(entries[0].date);
    } else {
      start = presetStart(range, today);
    }

    return { start, end: today, byDate, maxDistance };
  }, [data, range, today]);

  const values = useMemo(
    () =>
      Array.from(byDate.entries()).map(([date, distanceMeters]) => ({
        date,
        distanceMeters,
      })),
    [byDate],
  );

  const dimClass = loading && data ? "opacity-50" : "opacity-100";

  return (
    <Card className={`transition-opacity duration-200 ${dimClass}`}>
      <SectionHeading
        title="Activity heatmap"
        subtitle="Daily distance — darker means more ground covered"
        accent="aqua"
      />

      {error && !data ? (
        <p className="text-sm text-series-red">Couldn&apos;t load the heatmap: {error}</p>
      ) : (
        <>
          <div className="heatmap overflow-x-auto pb-1">
            <div className="min-w-[640px]">
              <CalendarHeatmap
                startDate={start}
                endDate={end}
                values={values}
                classForValue={(value) => {
                  const distanceMeters = (value as { distanceMeters?: number } | undefined)
                    ?.distanceMeters;
                  if (!distanceMeters) return "color-empty";
                  if (maxDistance <= 0) return "color-empty";
                  const level = Math.min(
                    SEQUENTIAL_LEVELS,
                    Math.max(1, Math.ceil((distanceMeters / maxDistance) * SEQUENTIAL_LEVELS)),
                  );
                  return `color-scale-${level}`;
                }}
                titleForValue={(value) => {
                  const v = value as { date?: string; distanceMeters?: number } | undefined;
                  if (!v?.date) return "";
                  return v.distanceMeters
                    ? `${formatDate(v.date)} — ${formatDistanceKm(v.distanceMeters)}`
                    : `${formatDate(v.date)} — rest day`;
                }}
                showWeekdayLabels
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-text-muted">
            <span>Less</span>
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-0)" }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-1)" }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-2)" }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-3)" }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-4)" }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: "var(--seq-5)" }} />
            <span>More</span>
          </div>
        </>
      )}
    </Card>
  );
}
