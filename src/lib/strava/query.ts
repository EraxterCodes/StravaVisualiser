import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/db";
import { activities } from "@/db/schema";
import type { DbClient } from "./credentials";
import { normalizeSportType } from "./sport-type";
import { decodePolyline } from "@/lib/polyline";
import type { StatsActivity } from "@/types/activity";

function pace(distanceMeters: number, movingTimeSeconds: number): number {
  return distanceMeters > 0 ? movingTimeSeconds / (distanceMeters / 1000) : 0;
}

/**
 * Reads every synced activity from the `activities` table and shapes it into
 * `StatsActivity` — the same shape the fixture data uses, so `@/lib/stats`'s
 * aggregation functions work unchanged against real data (ticket 10).
 */
export async function getStoredActivities(
  db: DbClient = defaultDb,
): Promise<StatsActivity[]> {
  const rows = await db.select().from(activities);

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    sportType: normalizeSportType(row.sportType),
    date: row.startDate.toISOString().slice(0, 10),
    startDateTime: row.startDate.toISOString(),
    distanceMeters: row.distanceMeters,
    movingTimeSeconds: row.movingTimeSeconds,
    averagePaceSecondsPerKm: pace(row.distanceMeters, row.movingTimeSeconds),
    totalElevationGainMeters: row.totalElevationGainMeters,
    calories: row.calories ?? 0,
    coordinates: row.polyline ? decodePolyline(row.polyline) : undefined,
  }));
}

/** Looks up a single activity's decoded GPS route by its (string) id. */
export async function getActivityRouteById(
  id: string,
  db: DbClient = defaultDb,
): Promise<[number, number][] | null> {
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) return null;

  const rows = await db
    .select({ polyline: activities.polyline })
    .from(activities)
    .where(eq(activities.id, idNum))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return row.polyline ? decodePolyline(row.polyline) : [];
}
