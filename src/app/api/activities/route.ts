import { NextRequest, NextResponse } from "next/server";
import { getStoredActivities } from "@/lib/strava/query";
import { parseTimeRange } from "@/lib/time-range";
import { filterActivitiesByRange } from "@/lib/stats";
import type { ActivitiesResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const allActivities = await getStoredActivities();
  const activities = filterActivitiesByRange(allActivities, range)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ id, name, sportType, date, distanceMeters, movingTimeSeconds, averagePaceSecondsPerKm }) => ({
      id,
      name,
      sportType,
      date,
      distanceMeters,
      movingTimeSeconds,
      averagePaceSecondsPerKm,
    }));

  const body: ActivitiesResponse = activities;
  return NextResponse.json(body);
}
