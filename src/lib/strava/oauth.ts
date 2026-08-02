const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";

/** Scopes requested during the one-time OAuth setup. `activity:read_all`
 * covers private activities too, since the owner is the only person we ever
 * sync data for. */
const STRAVA_SCOPES = "read,activity:read_all";

export interface BuildAuthorizeUrlOptions {
  clientId: string;
  redirectUri: string;
  state: string;
}

/** Builds the URL the owner's browser is redirected to in order to start the
 * Strava OAuth Authorization Code flow (ticket 03). */
export function buildStravaAuthorizeUrl({
  clientId,
  redirectUri,
  state,
}: BuildAuthorizeUrlOptions): string {
  const url = new URL(STRAVA_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}
