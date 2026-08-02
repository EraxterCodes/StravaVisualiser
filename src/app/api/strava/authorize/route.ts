import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isValidSharedSecret } from "@/lib/auth";
import { buildStravaAuthorizeUrl } from "@/lib/strava/oauth";
import { STRAVA_OAUTH_STATE_COOKIE } from "@/lib/strava/constants";

/**
 * Protected, one-time OAuth setup route (ticket 03). The owner visits this
 * URL directly in a browser with `?secret=<SYNC_SECRET>` to kick off the
 * Strava Authorization Code flow. Since this is a browser navigation (not a
 * fetch/curl call we control), the shared secret is checked as a query
 * param here rather than an `Authorization` header — unlike the sync route,
 * which is always called programmatically.
 *
 * A random `state` value is generated, stashed in a short-lived httpOnly
 * cookie, and echoed back by Strava on the callback so the callback route
 * can confirm the redirect actually originated from this request (CSRF
 * protection for the OAuth handshake) — this is on top of, not instead of,
 * the shared-secret gate on this route.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!isValidSharedSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRAVA_CLIENT_ID is not configured" },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${request.nextUrl.origin}/api/strava/callback`;
  const authorizeUrl = buildStravaAuthorizeUrl({ clientId, redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STRAVA_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
