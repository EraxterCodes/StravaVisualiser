import { NextRequest, NextResponse } from "next/server";
import { FIXTURE_ACTIVITIES } from "@/fixtures/activities";
import { parseTimeRange } from "@/lib/time-range";
import { computeTrends, filterActivitiesByRange } from "@/lib/stats";
import type { TrendsResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const range = parseTimeRange(request.nextUrl.searchParams);
  const activities = filterActivitiesByRange(FIXTURE_ACTIVITIES, range);
  const body: TrendsResponse = computeTrends(activities, range);
  return NextResponse.json(body);
}
