import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { GET, POST } from "./route";

const ORIGINAL_SECRET = process.env.SYNC_SECRET;
const TEST_LABEL = "__test_invite__";

function getRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/invites", { headers });
}

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/invites", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("GET/POST /api/invites", () => {
  afterEach(async () => {
    process.env.SYNC_SECRET = ORIGINAL_SECRET;
    await db.delete(invites).where(eq(invites.label, TEST_LABEL));
  });

  it("rejects GET with no Authorization header", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it("rejects POST with the wrong bearer token", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(
      postRequest({ label: TEST_LABEL }, { authorization: "Bearer wrong-secret" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects POST with a missing label", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(postRequest({}, { authorization: "Bearer correct-secret" }));
    expect(res.status).toBe(400);
  });

  it("creates an invite with a random token and lists it back", async () => {
    process.env.SYNC_SECRET = "correct-secret";

    const createRes = await POST(
      postRequest({ label: TEST_LABEL }, { authorization: "Bearer correct-secret" }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.label).toBe(TEST_LABEL);
    expect(created.token).toMatch(/^[0-9a-f]{32}$/);
    expect(created.revokedAt).toBeNull();
    expect(created.lastUsedAt).toBeNull();

    const listRes = await GET(getRequest({ authorization: "Bearer correct-secret" }));
    expect(listRes.status).toBe(200);
    const list: Array<{ id: number }> = await listRes.json();
    expect(list.some((i) => i.id === created.id)).toBe(true);
  });
});
