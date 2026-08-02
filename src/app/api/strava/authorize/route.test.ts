import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const ORIGINAL_SECRET = process.env.SYNC_SECRET;
const ORIGINAL_CLIENT_ID = process.env.STRAVA_CLIENT_ID;

afterEach(() => {
  process.env.SYNC_SECRET = ORIGINAL_SECRET;
  process.env.STRAVA_CLIENT_ID = ORIGINAL_CLIENT_ID;
});

describe("GET /api/strava/authorize", () => {
  it("rejects requests missing the secret query param", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await GET(new NextRequest("http://localhost/api/strava/authorize"));
    expect(res.status).toBe(401);
  });

  it("rejects requests with the wrong secret", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await GET(
      new NextRequest("http://localhost/api/strava/authorize?secret=wrong"),
    );
    expect(res.status).toBe(401);
  });

  it("500s with a clear message when STRAVA_CLIENT_ID is not configured", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    delete process.env.STRAVA_CLIENT_ID;
    const res = await GET(
      new NextRequest("http://localhost/api/strava/authorize?secret=correct-secret"),
    );
    expect(res.status).toBe(500);
  });

  it("redirects to Strava with a state cookie when authorized and configured", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    process.env.STRAVA_CLIENT_ID = "test-client-id";

    const res = await GET(
      new NextRequest("http://localhost/api/strava/authorize?secret=correct-secret"),
    );

    expect(res.status).toBe(307); // NextResponse.redirect default
    const location = res.headers.get("location");
    expect(location).toContain("https://www.strava.com/oauth/authorize");
    expect(location).toContain("client_id=test-client-id");
    expect(location).toContain("redirect_uri=");
    expect(location).toContain(encodeURIComponent("/api/strava/callback"));

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("strava_oauth_state=");
    expect(setCookie).toContain("HttpOnly");
  });
});
