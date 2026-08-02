import { NextRequest, NextResponse } from "next/server";
import { INVITE_COOKIE, isInviteTokenValid } from "@/lib/invite-auth";

/**
 * Paths exempt from the invite-cookie gate: owner/admin actions (their own
 * SYNC_SECRET check) and machine-to-machine routes (their own Bearer check),
 * plus the invite-link consumption route itself (self-validating). Anything
 * NOT listed here is deny-by-default and requires a valid invite cookie —
 * new routes are protected unless explicitly excepted, not the other way
 * around, since the whole point of this file is fixing a real data leak.
 */
const EXEMPT_PREFIXES = ["/invite/", "/admin", "/api/invites", "/api/sync", "/api/strava/"];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isExempt(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(INVITE_COOKIE)?.value;
  if (!token || !(await isInviteTokenValid(token))) {
    return new NextResponse("Access restricted. Ask the owner for an invite link.", {
      status: 403,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
