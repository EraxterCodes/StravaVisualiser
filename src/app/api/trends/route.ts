import { NextRequest, NextResponse } from "next/server";
import { getStoredActivities } from "@/lib/strava/query";
import { parseTimeRange } from "@/lib/time-range";
import { computeTrends, filterActivitiesByRange } from "@/lib/stats";
import type { TrendsResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const allActivities = await getStoredActivities();
  const activities = filterActivitiesByRange(allActivities, range);
  const body: TrendsResponse = computeTrends(activities, range);
  return NextResponse.json(body);
}
