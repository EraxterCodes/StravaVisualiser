"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, SectionHeading } from "@/components/dashboard/card";
import { formatDate, formatDistanceKm, formatPace } from "@/lib/format";
import { useTimeRange } from "@/lib/time-range-context";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { ActivitiesResponse, ActivityRouteResponse, SportType } from "@/types/api";

const RouteMap = dynamic(
  () => import("@/components/dashboard/route-map").then((mod) => mod.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
        Loading map…
      </div>
    ),
  },
);

const SPORT_DOT: Record<SportType, string> = {
  Run: "bg-series-blue",
  Ride: "bg-series-orange",
  Swim: "bg-series-aqua",
  Hike: "bg-series-yellow",
  Walk: "bg-series-magenta",
  Other: "bg-series-green",
};

export function ActivitiesSection() {
  const { range } = useTimeRange();
  const { data, loading, error } = useFetchJson<ActivitiesResponse>(
    `/api/activities?range=${range}`,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset the selection whenever a new activities list arrives (e.g. the
  // time-range changed) — computed during render, per React's "adjusting
  // state when a prop changes" pattern, rather than in an effect.
  const [syncedData, setSyncedData] = useState(data);
  if (data !== syncedData) {
    setSyncedData(data);
    setSelectedId(data && data.length > 0 ? data[0].id : null);
  }

  const { data: routeData, loading: routeLoading } = useFetchJson<ActivityRouteResponse>(
    selectedId ? `/api/activities/${selectedId}/route` : null,
  );

  const dimClass = loading && data ? "opacity-50" : "opacity-100";
  const selectedActivity = data?.find((a) => a.id === selectedId) ?? null;

  return (
    <div className={`grid grid-cols-1 gap-4 transition-opacity duration-200 lg:grid-cols-5 ${dimClass}`}>
      <Card className="lg:col-span-2">
        <SectionHeading title="Recent activities" subtitle="Select one to see its route" accent="magenta" />

        {error && !data ? (
          <p className="text-sm text-series-red">Couldn&apos;t load activities: {error}</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-text-muted">No activities in this range.</p>
        ) : (
          <ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1">
            {data.map((activity) => {
              const active = activity.id === selectedId;
              return (
                <li key={activity.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(activity.id)}
                    aria-pressed={active}
                    className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-series-blue/40 bg-series-blue/10"
                        : "border-transparent bg-surface-raised/50 hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${SPORT_DOT[activity.sportType]}`} />
                        <span className="truncate text-sm font-medium text-text-primary">
                          {activity.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-text-muted">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <div className="flex gap-3 pl-4 text-xs text-text-secondary">
                      <span>{activity.sportType}</span>
                      <span>{formatDistanceKm(activity.distanceMeters)}</span>
                      <span>{formatPace(activity.averagePaceSecondsPerKm)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col lg:col-span-3">
        <SectionHeading
          title="Route"
          subtitle={selectedActivity ? selectedActivity.name : "No activity selected"}
          accent="aqua"
        />
        <div className="h-[420px] w-full overflow-hidden rounded-xl border border-white/5">
          {!selectedId ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
              Select an activity to see its route.
            </div>
          ) : routeLoading && !routeData ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
              Loading route…
            </div>
          ) : routeData && routeData.coordinates.length > 0 ? (
            <RouteMap coordinates={routeData.coordinates} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center text-sm text-text-muted">
              <span>No GPS data available for this activity.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
