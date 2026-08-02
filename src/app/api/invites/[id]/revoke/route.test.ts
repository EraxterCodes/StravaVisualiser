import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { POST } from "./route";

const ORIGINAL_SECRET = process.env.SYNC_SECRET;
const TEST_LABEL = "__test_revoke__";

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/invites/1/revoke", {
    method: "POST",
    headers,
  });
}

describe("POST /api/invites/:id/revoke", () => {
  afterEach(async () => {
    process.env.SYNC_SECRET = ORIGINAL_SECRET;
    await db.delete(invites).where(eq(invites.label, TEST_LABEL));
  });

  it("rejects with no Authorization header", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(request(), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent invite", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const res = await POST(request({ authorization: "Bearer correct-secret" }), {
      params: Promise.resolve({ id: "999999999" }),
    });
    expect(res.status).toBe(404);
  });

  it("marks a real invite as revoked", async () => {
    process.env.SYNC_SECRET = "correct-secret";
    const [inserted] = await db
      .insert(invites)
      .values({ token: "test-token-revoke-route", label: TEST_LABEL })
      .returning();

    const res = await POST(request({ authorization: "Bearer correct-secret" }), {
      params: Promise.resolve({ id: String(inserted.id) }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revokedAt).not.toBeNull();
  });
});
