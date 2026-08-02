import { NextResponse } from "next/server";
import { getActivityRouteById } from "@/lib/strava/query";
import type { ActivityRouteResponse } from "@/types/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const coordinates = await getActivityRouteById(id);

  if (coordinates === null) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  const body: ActivityRouteResponse = { id, coordinates };
  return NextResponse.json(body);
}
