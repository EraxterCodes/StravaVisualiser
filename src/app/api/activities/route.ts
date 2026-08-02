import { NextRequest, NextResponse } from "next/server";
import { FIXTURE_ACTIVITIES } from "@/fixtures/activities";
import { parseTimeRange } from "@/lib/time-range";
import { filterActivitiesByRange } from "@/lib/stats";
import type { ActivitiesResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const activities = filterActivitiesByRange(FIXTURE_ACTIVITIES, range)
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
