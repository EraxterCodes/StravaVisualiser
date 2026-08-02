import { NextRequest, NextResponse } from "next/server";
import { FIXTURE_ACTIVITIES } from "@/fixtures/activities";
import { parseTimeRange } from "@/lib/time-range";
import { computeStats, filterActivitiesByRange } from "@/lib/stats";
import type { StatsResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const activities = filterActivitiesByRange(FIXTURE_ACTIVITIES, range);
  const body: StatsResponse = computeStats(activities, range);
  return NextResponse.json(body);
}
