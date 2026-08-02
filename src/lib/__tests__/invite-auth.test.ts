import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { isInviteTokenValid } from "../invite-auth";

const TEST_LABEL = "__test_invite_auth__";

describe("isInviteTokenValid", () => {
  afterEach(async () => {
    await db.delete(invites).where(eq(invites.label, TEST_LABEL));
  });

  it("returns false for a token that doesn't exist", async () => {
    expect(await isInviteTokenValid("does-not-exist-token")).toBe(false);
  });

  it("returns true for an active invite's token", async () => {
    await db.insert(invites).values({ token: "active-token-abc", label: TEST_LABEL });
    expect(await isInviteTokenValid("active-token-abc")).toBe(true);
  });

  it("returns false for a revoked invite's token", async () => {
    await db.insert(invites).values({
      token: "revoked-token-abc",
      label: TEST_LABEL,
      revokedAt: new Date(),
    });
    expect(await isInviteTokenValid("revoked-token-abc")).toBe(false);
  });
});
