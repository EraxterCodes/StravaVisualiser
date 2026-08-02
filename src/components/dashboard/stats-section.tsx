"use client";

import { Card, SectionHeading } from "@/components/dashboard/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import {
  formatCalories,
  formatCount,
  formatDate,
  formatDistanceKm,
  formatDuration,
  formatElevationM,
} from "@/lib/format";
import { useTimeRange } from "@/lib/time-range-context";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { SportType, StatsResponse } from "@/types/api";

/** Fixed hue order for sport types — matches the dataviz categorical slots
 * and is never reassigned based on which sports appear in a given range. */
const SPORT_ORDER: SportType[] = ["Run", "Ride", "Swim", "Hike", "Walk", "Other"];

const SPORT_BAR_COLOR: Record<SportType, string> = {
  Run: "bg-series-blue",
  Ride: "bg-series-orange",
  Swim: "bg-series-aqua",
  Hike: "bg-series-yellow",
  Walk: "bg-series-magenta",
  Other: "bg-series-green",
};

export function StatsSection() {
  const { range } = useTimeRange();
  const { data, loading, error } = useFetchJson<StatsResponse>(
    `/api/stats?range=${range}`,
  );

  const dimClass = loading && data ? "opacity-50" : "opacity-100";

  if (error && !data) {
    return (
      <Card>
        <p className="text-sm text-series-red">Couldn&apos;t load stats: {error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-white/5 bg-surface-raised/60"
          />
        ))}
      </div>
    );
  }

  const maxSportCount = Math.max(1, ...Object.values(data.activityCountBySportType));

  return (
    <div className={`flex flex-col gap-6 transition-opacity duration-200 ${dimClass}`}>
      <section>
        <SectionHeading title="Summary" subtitle="Overall training volume for the selected range" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total distance" value={formatDistanceKm(data.totalDistanceMeters)} accent="blue" />
          <StatTile label="Elevation gain" value={formatElevationM(data.totalElevationGainMeters)} accent="orange" />
          <StatTile label="Moving time" value={formatDuration(data.totalMovingTimeSeconds)} accent="aqua" />
          <StatTile label="Activities" value={formatCount(data.activityCount)} accent="violet" />
        </div>
      </section>

      <section>
        <SectionHeading title="Fun stats" subtitle="The numbers that make it tangible" accent="orange" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Calories burned" value={formatCalories(data.totalCalories)} accent="red" />
          <StatTile
            label="Distance, put another way"
            value={data.distanceEquivalence}
            sub={formatDistanceKm(data.totalDistanceMeters)}
            accent="blue"
          />
          <StatTile
            label="Elevation, put another way"
            value={data.elevationEquivalence}
            sub={formatElevationM(data.totalElevationGainMeters)}
            accent="orange"
          />
          <StatTile
            label="Longest streak"
            value={`${data.longestStreakDays} day${data.longestStreakDays === 1 ? "" : "s"}`}
            sub="Consecutive active days"
            accent="aqua"
          />
          <StatTile
            label="Most active"
            value={data.mostActiveDayOfWeek}
            sub={data.mostActiveTimeOfDay}
            accent="magenta"
          />
          {data.longestActivity ? (
            <StatTile
              label="Longest activity"
              value={formatDistanceKm(data.longestActivity.distanceMeters)}
              sub={
                <>
                  {data.longestActivity.name} · {formatDuration(data.longestActivity.movingTimeSeconds)} ·{" "}
                  {formatDate(data.longestActivity.date)}
                </>
              }
              accent="yellow"
            />
          ) : (
            <StatTile label="Longest activity" value="—" sub="No activities in range" accent="yellow" />
          )}
        </div>
      </section>

      {Object.keys(data.activityCountBySportType).length > 0 ? (
        <Card>
          <SectionHeading title="Activity mix" subtitle="Count by sport type" accent="aqua" />
          <div className="flex flex-col gap-2.5">
            {SPORT_ORDER.filter((sport) => data.activityCountBySportType[sport]).map((sport) => {
              const count = data.activityCountBySportType[sport] ?? 0;
              const pct = Math.max(6, Math.round((count / maxSportCount) * 100));
              return (
                <div key={sport} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm text-text-secondary">{sport}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${SPORT_BAR_COLOR[sport]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-text-primary">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
