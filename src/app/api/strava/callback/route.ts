import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { defaultStravaClient } from "@/lib/strava/api-client";
import { STRAVA_OAUTH_STATE_COOKIE } from "@/lib/strava/constants";
import { tokenResponseToCredentialsInput, upsertCredentials } from "@/lib/strava/credentials";

/**
 * Strava redirects here after the owner approves (or denies) access, as the
 * second half of the OAuth Authorization Code flow started by
 * /api/strava/authorize (ticket 03). Not gated by the shared secret directly
 * — Strava is the one calling this URL — instead it's protected by the
 * `state` CSRF check against the cookie set by the authorize route, so only
 * a flow this app itself initiated can complete successfully.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  const cookieState = request.cookies.get(STRAVA_OAUTH_STATE_COOKIE)?.value;

  if (error) {
    return NextResponse.json(
      { error: `Strava authorization was not granted: ${error}` },
      { status: 400 },
    );
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.json(
      { error: "Missing or invalid OAuth state. Restart the flow at /api/strava/authorize." },
      { status: 400 },
    );
  }

  const stravaClient = defaultStravaClient();
  const token = await stravaClient.exchangeAuthorizationCode(code);

  if (!token.athlete?.id) {
    return NextResponse.json(
      { error: "Strava did not return an athlete id with the token exchange." },
      { status: 502 },
    );
  }

  await upsertCredentials(
    db,
    tokenResponseToCredentialsInput(token, BigInt(token.athlete.id)),
  );

  const response = NextResponse.json({
    message: "Strava account connected successfully. You can close this tab.",
  });
  response.cookies.delete(STRAVA_OAUTH_STATE_COOKIE);
  return response;
}
