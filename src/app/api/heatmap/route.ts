import { NextRequest, NextResponse } from "next/server";
import { getStoredActivities } from "@/lib/strava/query";
import { parseTimeRange } from "@/lib/time-range";
import { computeHeatmap, filterActivitiesByRange } from "@/lib/stats";
import type { HeatmapResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const allActivities = await getStoredActivities();
  const activities = filterActivitiesByRange(allActivities, range);
  const body: HeatmapResponse = computeHeatmap(activities);
  return NextResponse.json(body);
}
