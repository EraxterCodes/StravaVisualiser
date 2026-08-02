import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { gte } from "drizzle-orm";
import { db } from "@/db";
import { activities, stravaCredentials } from "@/db/schema";
import { syncActivities } from "../sync";
import type { StravaActivity, StravaClient, StravaTokenResponse } from "../types";

/**
 * Real Strava activity IDs are currently well below this value (low
 * trillions at most), so anything at/above it is unambiguously test data —
 * lets cleanup use a simple `stravaId >= TEST_ID_FLOOR` filter instead of
 * tracking individual IDs.
 */
const TEST_ID_FLOOR = BigInt(9_000_000_000_000_000);

function fakeActivity(offset: number, overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: Number(TEST_ID_FLOOR + BigInt(offset)),
    name: `Test Activity ${offset}`,
    sport_type: "Run",
    start_date: "2026-01-01T08:00:00Z",
    distance: 5000,
    moving_time: 1500,
    elapsed_time: 1600,
    total_elevation_gain: 30,
    calories: null,
    average_speed: 3.33,
    map: { summary_polyline: "abc123" },
    ...overrides,
  };
}

function fakeStravaClient(config: {
  activitiesByPage: StravaActivity[][];
  refreshedToken?: StravaTokenResponse;
  /** Map from activity id to the calories the detail endpoint should return
   * for it. Ids not present here cause getActivityDetail to throw. */
  detailCalories?: Record<number, number>;
}) {
  const refreshCalls: string[] = [];
  const listCalls: number[] = [];
  const detailCalls: number[] = [];
  const client: StravaClient = {
    async exchangeAuthorizationCode() {
      throw new Error("not used in sync tests");
    },
    async refreshAccessToken(refreshToken: string) {
      refreshCalls.push(refreshToken);
      if (!config.refreshedToken) {
        throw new Error("refreshAccessToken should not have been called");
      }
      return config.refreshedToken;
    },
    async listActivities({ page = 1 }) {
      listCalls.push(page);
      return config.activitiesByPage[page - 1] ?? [];
    },
    async getActivityDetail(_accessToken: string, id: number) {
      detailCalls.push(id);
      const calories = config.detailCalories?.[id];
      if (calories === undefined) {
        throw new Error(`no fake detail configured for activity ${id}`);
      }
      return { calories };
    },
  };
  return { client, refreshCalls, listCalls, detailCalls };
}

let credentialsSnapshot: (typeof stravaCredentials.$inferSelect)[];

beforeAll(async () => {
  credentialsSnapshot = await db.select().from(stravaCredentials);
});

afterEach(async () => {
  await db.delete(activities).where(gte(activities.stravaId, TEST_ID_FLOOR));
  await db.delete(stravaCredentials);
});

afterAll(async () => {
  if (credentialsSnapshot.length > 0) {
    await db.insert(stravaCredentials).values(credentialsSnapshot);
  }
});

async function seedValidCredentials() {
  await db.insert(stravaCredentials).values({
    athleteId: BigInt(999_999_999),
    accessToken: "valid-access-token",
    refreshToken: "valid-refresh-token",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
}

describe("syncActivities", () => {
  it("throws if no credentials have been stored yet", async () => {
    const { client } = fakeStravaClient({ activitiesByPage: [[]] });
    await expect(syncActivities({ db, stravaClient: client })).rejects.toThrow(
      /No Strava credentials found/,
    );
  });

  it("fetches activities from the fake Strava client and inserts them", async () => {
    await seedValidCredentials();
    const { client, listCalls } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1), fakeActivity(2)]],
    });

    const result = await syncActivities({ db, stravaClient: client });

    expect(result).toEqual({ fetched: 2, upserted: 2 });
    expect(listCalls).toEqual([1]); // stops after a short page, no page 2 call

    const rows = await db
      .select()
      .from(activities)
      .where(gte(activities.stravaId, TEST_ID_FLOOR));
    expect(rows).toHaveLength(2);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(["Test Activity 1", "Test Activity 2"]);
  });

  it("upserts on re-sync instead of creating duplicates, and updates changed fields", async () => {
    await seedValidCredentials();
    const { client: firstClient } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1, { name: "Original Name", distance: 5000 })]],
    });
    await syncActivities({ db, stravaClient: firstClient });

    const { client: secondClient } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1, { name: "Renamed", distance: 5555 })]],
    });
    const result = await syncActivities({ db, stravaClient: secondClient });

    expect(result).toEqual({ fetched: 1, upserted: 1 });

    const rows = await db
      .select()
      .from(activities)
      .where(gte(activities.stravaId, TEST_ID_FLOOR));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Renamed");
    expect(rows[0].distanceMeters).toBe(5555);
  });

  it("paginates until a short page is returned", async () => {
    await seedValidCredentials();
    const fullPage = Array.from({ length: 100 }, (_, i) => fakeActivity(i + 1));
    const secondPage = [fakeActivity(200)];
    const { client, listCalls } = fakeStravaClient({
      activitiesByPage: [fullPage, secondPage],
    });

    const result = await syncActivities({ db, stravaClient: client });

    expect(result).toEqual({ fetched: 101, upserted: 101 });
    expect(listCalls).toEqual([1, 2]);
  });

  it("refreshes an expired access token before fetching activities", async () => {
    await db.insert(stravaCredentials).values({
      athleteId: BigInt(999_999_999),
      accessToken: "expired-token",
      refreshToken: "refresh-me",
      expiresAt: new Date(Date.now() - 1000),
    });

    const { client, refreshCalls } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1)]],
      refreshedToken: {
        access_token: "fresh-token",
        refresh_token: "fresh-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 21600,
      },
    });

    await syncActivities({ db, stravaClient: client });

    expect(refreshCalls).toEqual(["refresh-me"]);

    const [credRow] = await db.select().from(stravaCredentials);
    expect(credRow.accessToken).toBe("fresh-token");
  });

  it("backfills calories via the detail endpoint when the list endpoint omits them", async () => {
    await seedValidCredentials();
    const id = Number(TEST_ID_FLOOR + BigInt(1));
    const { client, detailCalls } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1)]], // calories: null, per fakeActivity's default
      detailCalories: { [id]: 555 },
    });

    await syncActivities({ db, stravaClient: client });

    expect(detailCalls).toEqual([id]);
    const rows = await db
      .select()
      .from(activities)
      .where(gte(activities.stravaId, TEST_ID_FLOOR));
    expect(rows[0].calories).toBe(555);
  });

  it("does not re-fetch detail for activities that already have calories stored", async () => {
    await seedValidCredentials();
    const id = Number(TEST_ID_FLOOR + BigInt(1));
    const { client: firstClient } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1)]],
      detailCalories: { [id]: 555 },
    });
    await syncActivities({ db, stravaClient: firstClient });

    const { client: secondClient, detailCalls } = fakeStravaClient({
      activitiesByPage: [[fakeActivity(1, { name: "Renamed" })]], // still calories: null from Strava
      detailCalories: {}, // getActivityDetail should not be called at all
    });
    await syncActivities({ db, stravaClient: secondClient });

    expect(detailCalls).toEqual([]);
    const rows = await db
      .select()
      .from(activities)
      .where(gte(activities.stravaId, TEST_ID_FLOOR));
    expect(rows[0].name).toBe("Renamed");
    expect(rows[0].calories).toBe(555); // preserved, not overwritten with null
  });

  it("caps calorie backfills at MAX_CALORIE_BACKFILLS_PER_SYNC per run", async () => {
    await seedValidCredentials();
    const batch = Array.from({ length: 25 }, (_, i) => fakeActivity(i + 1));
    const detailCalories = Object.fromEntries(
      batch.map((a) => [a.id, 100]),
    );
    const { client, detailCalls } = fakeStravaClient({
      activitiesByPage: [batch],
      detailCalories,
    });

    await syncActivities({ db, stravaClient: client });

    expect(detailCalls).toHaveLength(20);
  });
});
