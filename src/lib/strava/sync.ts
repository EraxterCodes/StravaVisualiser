import { db as defaultDb } from "@/db";
import { activities } from "@/db/schema";
import { defaultStravaClient } from "./api-client";
import { ensureFreshAccessToken, getStoredCredentials, type DbClient } from "./credentials";
import type { StravaActivity, StravaClient } from "./types";

/** Safety cap on pagination — 50 pages * 100/page = 5000 activities, far more
 * than a single sync should ever need to fetch, protects against an infinite
 * loop if Strava's pagination behaves unexpectedly. */
const MAX_PAGES = 50;
const PER_PAGE = 100;

export interface SyncActivitiesOptions {
  db?: DbClient;
  stravaClient?: StravaClient;
}

export interface SyncResult {
  /** Total activities fetched from Strava in this run. */
  fetched: number;
  /** Total activities inserted or updated in the `activities` table. */
  upserted: number;
}

function toRow(activity: StravaActivity) {
  return {
    stravaId: BigInt(activity.id),
    name: activity.name,
    sportType: activity.sport_type,
    startDate: new Date(activity.start_date),
    distanceMeters: activity.distance,
    movingTimeSeconds: activity.moving_time,
    elapsedTimeSeconds: activity.elapsed_time,
    totalElevationGainMeters: activity.total_elevation_gain,
    calories: activity.calories ?? null,
    averageSpeedMetersPerSecond: activity.average_speed ?? null,
    polyline: activity.map?.summary_polyline ?? null,
    updatedAt: new Date(),
  };
}

async function fetchAllActivities(
  stravaClient: StravaClient,
  accessToken: string,
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await stravaClient.listActivities({
      accessToken,
      page,
      perPage: PER_PAGE,
    });
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

/**
 * The core sync pipeline (ticket 04): fetches activities from the Strava API
 * using the stored credentials (refreshing the access token first if it's
 * expired/about to expire) and upserts them into the `activities` table,
 * keyed on `stravaId`.
 *
 * Both the Strava client and the DB client are injectable so this can be
 * exercised in tests against a faked Strava client and a real test database,
 * with no live network calls.
 */
export async function syncActivities(
  options: SyncActivitiesOptions = {},
): Promise<SyncResult> {
  const db = options.db ?? defaultDb;
  const stravaClient = options.stravaClient ?? defaultStravaClient();

  const credentials = await getStoredCredentials(db);
  if (!credentials) {
    throw new Error(
      "No Strava credentials found. Complete the one-time OAuth setup (/api/strava/authorize) first.",
    );
  }

  const accessToken = await ensureFreshAccessToken(db, stravaClient, credentials);
  const fetched = await fetchAllActivities(stravaClient, accessToken);

  for (const activity of fetched) {
    const row = toRow(activity);
    await db
      .insert(activities)
      .values(row)
      .onConflictDoUpdate({
        target: activities.stravaId,
        set: row,
      });
  }

  return { fetched: fetched.length, upserted: fetched.length };
}
