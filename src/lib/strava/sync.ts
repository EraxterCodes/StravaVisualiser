import { inArray } from "drizzle-orm";
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

/**
 * Strava's activity *list* endpoint (which the main sync loop uses) doesn't
 * return `calories` — only the per-activity *detail* endpoint does. Fetching
 * detail for every activity on every sync would scale badly (a growing
 * history means a growing number of API calls every single hour), so instead
 * each sync backfills calories for at most this many activities that don't
 * have it yet, prioritizing the most recent (Strava's list endpoint returns
 * newest-first). A big initial backlog drains gradually, a few runs at a
 * time, while new activities (typically 0-2 per hour) get their calories
 * filled in on the very next sync after they appear.
 */
const MAX_CALORIE_BACKFILLS_PER_SYNC = 20;

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

function toRow(activity: StravaActivity, calories: number | null) {
  return {
    stravaId: BigInt(activity.id),
    name: activity.name,
    sportType: activity.sport_type,
    startDate: new Date(activity.start_date),
    distanceMeters: activity.distance,
    movingTimeSeconds: activity.moving_time,
    elapsedTimeSeconds: activity.elapsed_time,
    totalElevationGainMeters: activity.total_elevation_gain,
    calories,
    averageSpeedMetersPerSecond: activity.average_speed ?? null,
    polyline: activity.map?.summary_polyline ?? null,
    updatedAt: new Date(),
  };
}

/** Looks up which of the given Strava activity ids already have a
 * (non-null) `calories` value stored, so a re-sync doesn't re-fetch detail
 * for activities that were already backfilled. */
async function getExistingCalories(
  db: DbClient,
  stravaIds: bigint[],
): Promise<Map<bigint, number | null>> {
  if (stravaIds.length === 0) return new Map();
  const rows = await db
    .select({ stravaId: activities.stravaId, calories: activities.calories })
    .from(activities)
    .where(inArray(activities.stravaId, stravaIds));
  return new Map(rows.map((r) => [r.stravaId, r.calories]));
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

  const existingCalories = await getExistingCalories(
    db,
    fetched.map((a) => BigInt(a.id)),
  );

  let backfillsRemaining = MAX_CALORIE_BACKFILLS_PER_SYNC;

  for (const activity of fetched) {
    let calories = activity.calories ?? existingCalories.get(BigInt(activity.id)) ?? null;

    if (calories == null && backfillsRemaining > 0) {
      backfillsRemaining--;
      try {
        const detail = await stravaClient.getActivityDetail(accessToken, activity.id);
        calories = detail.calories ?? null;
      } catch {
        // Leave it null — a later sync will retry. One failed detail call
        // (rate limit, transient network error) shouldn't fail the whole sync.
      }
    }

    const row = toRow(activity, calories);
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
