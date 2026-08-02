/**
 * Domain-layer types for the Strava integration (spec tickets 03/04).
 *
 * These mirror the subset of Strava's API v3 response shapes this app relies
 * on. They are intentionally separate from `@/types/api` (the frontend/backend
 * contract) — these describe what Strava sends us, not what we serve.
 */

/** Response shape from Strava's OAuth token endpoint (both the authorization-code
 * exchange and the refresh-token exchange return this same shape). */
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  /** Unix timestamp (seconds) the access token expires at. */
  expires_at: number;
  /** Only present on the initial authorization-code exchange. */
  athlete?: {
    id: number;
  };
}

/** A single activity as returned by Strava's `GET /athlete/activities` list
 * endpoint. Note: the list endpoint does not include `calories` — that field
 * is only available via the per-activity detail endpoint, which this app does
 * not call (to stay well within Strava's rate limits during sync). */
export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  calories?: number | null;
  average_speed?: number | null;
  map?: {
    summary_polyline?: string | null;
  } | null;
}

export interface ListActivitiesParams {
  accessToken: string;
  page?: number;
  perPage?: number;
  /** Unix timestamp (seconds); only return activities starting after this. */
  after?: number;
}

/**
 * The Strava API surface the domain layer depends on. Both the sync logic and
 * the OAuth setup route depend on this interface, not the concrete HTTP
 * implementation, so tests can supply a fake and never hit the network.
 */
export interface StravaClient {
  exchangeAuthorizationCode(code: string): Promise<StravaTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse>;
  listActivities(params: ListActivitiesParams): Promise<StravaActivity[]>;
}
