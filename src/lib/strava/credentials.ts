import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/db";
import { stravaCredentials } from "@/db/schema";
import type { StravaClient, StravaTokenResponse } from "./types";

/** The subset of the Drizzle client the domain layer needs — injectable so
 * tests can point at a real test database instead of the production/dev one
 * without depending on Drizzle's full type surface. */
export type DbClient = typeof defaultDb;

export interface StoredCredentials {
  athleteId: bigint;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/** Reads the single stored credentials row, if the owner has completed OAuth
 * setup (ticket 03). Returns null otherwise — callers decide how to react. */
export async function getStoredCredentials(
  db: DbClient = defaultDb,
): Promise<StoredCredentials | null> {
  const rows = await db.select().from(stravaCredentials).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    athleteId: row.athleteId,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
  };
}

export interface UpsertCredentialsInput {
  athleteId: bigint;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Persists Strava credentials as the single row in `strava_credentials`.
 * There is no DB-level uniqueness constraint on this table (it's a
 * single-row-by-convention table, per the spec), so "upsert" is implemented
 * at the application level: update the existing row if one exists, otherwise
 * insert. Re-running the OAuth flow (ticket 03) always converges on one row.
 */
export async function upsertCredentials(
  db: DbClient,
  input: UpsertCredentialsInput,
): Promise<void> {
  const existing = await db
    .select({ id: stravaCredentials.id })
    .from(stravaCredentials)
    .limit(1);

  const values = {
    athleteId: input.athleteId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db
      .update(stravaCredentials)
      .set(values)
      .where(eq(stravaCredentials.id, existing[0].id));
  } else {
    await db.insert(stravaCredentials).values(values);
  }
}

export function tokenResponseToCredentialsInput(
  token: StravaTokenResponse,
  athleteId: bigint,
): UpsertCredentialsInput {
  return {
    athleteId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(token.expires_at * 1000),
  };
}

/** How long before actual expiry to proactively refresh, so a token that's
 * technically still valid but about to expire mid-sync doesn't fail a
 * paginated Strava API call partway through. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Returns a Strava access token guaranteed to be valid for immediate use,
 * refreshing (and persisting the refreshed token) if the stored one is
 * expired or about to expire.
 */
export async function ensureFreshAccessToken(
  db: DbClient,
  stravaClient: StravaClient,
  credentials: StoredCredentials,
  now: Date = new Date(),
): Promise<string> {
  if (credentials.expiresAt.getTime() - REFRESH_BUFFER_MS > now.getTime()) {
    return credentials.accessToken;
  }

  const refreshed = await stravaClient.refreshAccessToken(credentials.refreshToken);
  await upsertCredentials(
    db,
    tokenResponseToCredentialsInput(refreshed, credentials.athleteId),
  );
  return refreshed.access_token;
}
