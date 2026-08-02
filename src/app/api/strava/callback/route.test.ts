import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { stravaCredentials } from "@/db/schema";

vi.mock("@/lib/strava/api-client", () => ({
  defaultStravaClient: vi.fn(),
}));

import { defaultStravaClient } from "@/lib/strava/api-client";
import { GET } from "./route";

function requestWithCookie(url: string, cookieState?: string) {
  const headers: Record<string, string> = {};
  if (cookieState) headers.cookie = `strava_oauth_state=${cookieState}`;
  return new NextRequest(url, { headers });
}

let credentialsSnapshot: (typeof stravaCredentials.$inferSelect)[];

beforeAll(async () => {
  credentialsSnapshot = await db.select().from(stravaCredentials);
});

afterEach(async () => {
  await db.delete(stravaCredentials);
  vi.mocked(defaultStravaClient).mockReset();
});

afterAll(async () => {
  if (credentialsSnapshot.length > 0) {
    await db.insert(stravaCredentials).values(credentialsSnapshot);
  }
});

describe("GET /api/strava/callback", () => {
  it("returns 400 when Strava reports an authorization error", async () => {
    const res = await GET(
      requestWithCookie("http://localhost/api/strava/callback?error=access_denied"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when code/state are missing", async () => {
    const res = await GET(requestWithCookie("http://localhost/api/strava/callback"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the state does not match the cookie (CSRF protection)", async () => {
    const res = await GET(
      requestWithCookie(
        "http://localhost/api/strava/callback?code=abc&state=state-a",
        "state-b",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("exchanges the code and persists credentials on a valid callback", async () => {
    vi.mocked(defaultStravaClient).mockReturnValue({
      exchangeAuthorizationCode: vi.fn().mockResolvedValue({
        access_token: "access-xyz",
        refresh_token: "refresh-xyz",
        expires_at: Math.floor(Date.now() / 1000) + 21600,
        athlete: { id: 42 },
      }),
      refreshAccessToken: vi.fn(),
      listActivities: vi.fn(),
    });

    const res = await GET(
      requestWithCookie(
        "http://localhost/api/strava/callback?code=abc&state=matching-state",
        "matching-state",
      ),
    );

    expect(res.status).toBe(200);
    const [row] = await db.select().from(stravaCredentials);
    expect(row.athleteId).toBe(BigInt(42));
    expect(row.accessToken).toBe("access-xyz");
    expect(row.refreshToken).toBe("refresh-xyz");
  });
});
