import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { GET } from "./route";
import { INVITE_COOKIE } from "@/lib/invite-auth";

const TEST_LABEL = "__test_invite_route__";

describe("GET /invite/:token", () => {
  afterEach(async () => {
    await db.delete(invites).where(eq(invites.label, TEST_LABEL));
  });

  it("returns 403 for a nonexistent token", async () => {
    const res = await GET(new Request("http://localhost/invite/nope"), {
      params: Promise.resolve({ token: "nope" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 for a revoked token", async () => {
    await db.insert(invites).values({
      token: "revoked-route-token",
      label: TEST_LABEL,
      revokedAt: new Date(),
    });
    const res = await GET(new Request("http://localhost/invite/revoked-route-token"), {
      params: Promise.resolve({ token: "revoked-route-token" }),
    });
    expect(res.status).toBe(403);
  });

  it("sets the session cookie, redirects home, and records lastUsedAt for a valid token", async () => {
    const [inserted] = await db
      .insert(invites)
      .values({ token: "valid-route-token", label: TEST_LABEL })
      .returning();
    expect(inserted.lastUsedAt).toBeNull();

    const res = await GET(new Request("http://localhost/invite/valid-route-token"), {
      params: Promise.resolve({ token: "valid-route-token" }),
    });

    expect(res.status).toBe(307); // NextResponse.redirect default
    expect(res.headers.get("location")).toBe("http://localhost/");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${INVITE_COOKIE}=valid-route-token`);
    expect(setCookie).toContain("HttpOnly");

    const [updated] = await db.select().from(invites).where(eq(invites.id, inserted.id));
    expect(updated.lastUsedAt).not.toBeNull();
  });
});
