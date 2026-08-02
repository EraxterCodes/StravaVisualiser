import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { stravaCredentials } from "@/db/schema";
import {
  ensureFreshAccessToken,
  getStoredCredentials,
  upsertCredentials,
  type StoredCredentials,
} from "../credentials";
import type { StravaClient, StravaTokenResponse } from "../types";

/**
 * `strava_credentials` is a single-row-by-convention table (per spec), so
 * these tests snapshot whatever's there before running and restore it
 * afterwards, rather than assuming the table starts empty — the real dev
 * database may already hold a genuine credential from ticket 03.
 */
let snapshot: (typeof stravaCredentials.$inferSelect)[];

beforeAll(async () => {
  snapshot = await db.select().from(stravaCredentials);
});

afterEach(async () => {
  await db.delete(stravaCredentials);
});

afterAll(async () => {
  await db.delete(stravaCredentials);
  if (snapshot.length > 0) {
    await db.insert(stravaCredentials).values(snapshot);
  }
});

function fakeStravaClientWithRefresh(refreshedToken: StravaTokenResponse) {
  const calls: string[] = [];
  const client: StravaClient = {
    async exchangeAuthorizationCode() {
      throw new Error("not used in this test");
    },
    async refreshAccessToken(refreshToken: string) {
      calls.push(refreshToken);
      return refreshedToken;
    },
    async listActivities() {
      throw new Error("not used in this test");
    },
  };
  return { client, calls };
}

describe("upsertCredentials", () => {
  it("inserts a new row when none exists", async () => {
    await upsertCredentials(db, {
      athleteId: BigInt(12345),
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    });

    const stored = await getStoredCredentials(db);
    expect(stored).toEqual<StoredCredentials>({
      athleteId: BigInt(12345),
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    });
  });

  it("updates the existing row instead of inserting a second one", async () => {
    await upsertCredentials(db, {
      athleteId: BigInt(12345),
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    });
    await upsertCredentials(db, {
      athleteId: BigInt(12345),
      accessToken: "access-2",
      refreshToken: "refresh-2",
      expiresAt: new Date("2031-01-01T00:00:00Z"),
    });

    const rows = await db.select().from(stravaCredentials);
    expect(rows).toHaveLength(1);
    expect(rows[0].accessToken).toBe("access-2");
    expect(rows[0].refreshToken).toBe("refresh-2");
  });
});

describe("ensureFreshAccessToken", () => {
  it("returns the stored token without refreshing when it is not near expiry", async () => {
    const credentials: StoredCredentials = {
      athleteId: BigInt(12345),
      accessToken: "still-valid",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
    await upsertCredentials(db, credentials);

    const { client, calls } = fakeStravaClientWithRefresh({
      access_token: "should-not-be-used",
      refresh_token: "should-not-be-used",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    const token = await ensureFreshAccessToken(db, client, credentials);

    expect(token).toBe("still-valid");
    expect(calls).toHaveLength(0);
  });

  it("refreshes and persists a new token when the stored one is expired", async () => {
    const credentials: StoredCredentials = {
      athleteId: BigInt(12345),
      accessToken: "expired",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.now() - 1000),
    };
    await upsertCredentials(db, credentials);

    const newExpiresAt = Math.floor(Date.now() / 1000) + 21600;
    const { client, calls } = fakeStravaClientWithRefresh({
      access_token: "refreshed-access",
      refresh_token: "refreshed-refresh",
      expires_at: newExpiresAt,
    });

    const token = await ensureFreshAccessToken(db, client, credentials);

    expect(token).toBe("refreshed-access");
    expect(calls).toEqual(["refresh-1"]);

    const stored = await getStoredCredentials(db);
    expect(stored?.accessToken).toBe("refreshed-access");
    expect(stored?.refreshToken).toBe("refreshed-refresh");
    expect(stored?.expiresAt.getTime()).toBe(newExpiresAt * 1000);
  });

  it("refreshes when the stored token is valid but within the refresh buffer", async () => {
    const credentials: StoredCredentials = {
      athleteId: BigInt(12345),
      accessToken: "about-to-expire",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute left, buffer is 5
    };
    await upsertCredentials(db, credentials);

    const { client, calls } = fakeStravaClientWithRefresh({
      access_token: "refreshed-access",
      refresh_token: "refreshed-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 21600,
    });

    await ensureFreshAccessToken(db, client, credentials);

    expect(calls).toHaveLength(1);
  });
});
