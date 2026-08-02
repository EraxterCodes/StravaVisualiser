import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/invite-auth";

/**
 * Visiting an invite link once sets a long-lived session cookie (checked
 * against the DB by middleware on every subsequent request, so revoking the
 * invite takes effect immediately regardless of the cookie's own lifetime).
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const rows = await db
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.token, token), isNull(invites.revokedAt)))
    .limit(1);
  const invite = rows[0];

  if (!invite) {
    return new NextResponse("This invite link is invalid or has been revoked.", {
      status: 403,
    });
  }

  await db.update(invites).set({ lastUsedAt: new Date() }).where(eq(invites.id, invite.id));

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: INVITE_COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
