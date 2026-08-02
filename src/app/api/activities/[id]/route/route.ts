import { NextResponse } from "next/server";
import { FIXTURE_ACTIVITIES } from "@/fixtures/activities";
import type { ActivityRouteResponse } from "@/types/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const activity = FIXTURE_ACTIVITIES.find((a) => a.id === id);

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  const body: ActivityRouteResponse = {
    id: activity.id,
    coordinates: activity.coordinates ?? [],
  };
  return NextResponse.json(body);
}
