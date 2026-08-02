import { neon } from "@neondatabase/serverless";

export const INVITE_COOKIE = "invite_token";

/** One year, in seconds — invite sessions are permanent-until-revoked, not
 * time-limited; this is routine cookie hygiene, not an access control. */
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Checks a candidate invite token against the database directly (via the
 * fetch-based Neon driver, not the Drizzle client) so this works from
 * middleware regardless of Edge/Node runtime. Revocation takes effect
 * immediately since this hits the DB on every request rather than trusting
 * a signed cookie.
 */
export async function isInviteTokenValid(token: string): Promise<boolean> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    select 1 from invites where token = ${token} and revoked_at is null limit 1
  `;
  return rows.length > 0;
}
