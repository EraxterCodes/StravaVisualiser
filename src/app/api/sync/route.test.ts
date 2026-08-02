import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/strava/sync", () => ({
  syncActivities: vi.fn(),
}));

import { syncActivities } from "@/lib/strava/sync";
import { POST } from "./route";

const ORIGINAL_SECRET = process.env.SYNC_SECRET;

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/sync", {
    method: "POST",
    headers,
  });
}

describe("POST /api/sync", () => {
  afterEach(() => {
    process.env.SYNC_SECRET = ORIGINAL_SECRET;
    vi.mocked(syncActivities).mockReset();
  });

  it("rejects requests with no Authorization header", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(syncActivities).not.toHaveBeenCalled();
  });

  it("rejects requests with the wrong bearer token", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(request({ authorization: "Bearer wrong-secret" }));
    expect(res.status).toBe(401);
    expect(syncActivities).not.toHaveBeenCalled();
  });

  it("calls syncActivities and returns its result when authorized", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    vi.mocked(syncActivities).mockResolvedValue({ fetched: 3, upserted: 3 });

    const res = await POST(request({ authorization: "Bearer correct-secret" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fetched: 3, upserted: 3 });
    expect(syncActivities).toHaveBeenCalledTimes(1);
  });

  it("returns 500 with the error message when syncActivities throws", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    vi.mocked(syncActivities).mockRejectedValue(new Error("boom"));

    const res = await POST(request({ authorization: "Bearer correct-secret" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
