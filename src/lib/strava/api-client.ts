import type {
  ListActivitiesParams,
  StravaActivity,
  StravaClient,
  StravaTokenResponse,
} from "./types";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

export interface StravaApiClientConfig {
  clientId: string;
  clientSecret: string;
}

async function postForm(url: string, body: Record<string, string>): Promise<StravaTokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strava token request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as StravaTokenResponse;
}

/** Real, network-backed implementation of {@link StravaClient}. Never used in
 * tests — tests supply a fake implementing the same interface instead. */
export function createStravaApiClient(config: StravaApiClientConfig): StravaClient {
  return {
    async exchangeAuthorizationCode(code: string): Promise<StravaTokenResponse> {
      return postForm(STRAVA_TOKEN_URL, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
      });
    },

    async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
      return postForm(STRAVA_TOKEN_URL, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });
    },

    async listActivities({
      accessToken,
      page = 1,
      perPage = 100,
      after,
    }: ListActivitiesParams): Promise<StravaActivity[]> {
      const url = new URL(STRAVA_ACTIVITIES_URL);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(perPage));
      if (after !== undefined) url.searchParams.set("after", String(after));

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Strava list activities failed (${res.status}): ${text}`);
      }
      return (await res.json()) as StravaActivity[];
    },
  };
}

/** Builds the default Strava client from env vars. Throws if they're missing
 * rather than returning a client that will fail on first use, so misconfig is
 * caught immediately when a route/job actually needs Strava access. */
export function defaultStravaClient(): StravaClient {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set to talk to the real Strava API",
    );
  }
  return createStravaApiClient({ clientId, clientSecret });
}
