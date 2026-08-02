# 03 — Strava OAuth one-time setup route

**What to build:** The one-time flow that lets the owner connect their own Strava account, persisting a real credential the sync logic can later use.

**Blocked by:** 02

**Status:** done

- [x] A protected route (gated by the shared secret) initiates the Strava OAuth Authorization Code flow — `GET /api/strava/authorize?secret=<SYNC_SECRET>`
- [x] Completing the flow exchanges the authorization code for an access token and refresh token — live-verified 2026-08-02: owner registered a Strava API app (client id `269390`), visited the authorize link, and the callback exchanged the code and returned "Strava account connected successfully"
- [x] The resulting token and expiry are persisted to the `strava_credentials` table (single row; re-running the flow upserts it) — verified with a real test-database round trip
- [x] Hitting the route without the correct shared secret is rejected — verified (missing secret and wrong secret both 401)

## Comments

**Design.** `GET /api/strava/authorize?secret=<SYNC_SECRET>` is meant for the owner to
open directly in a browser, so the shared secret is checked as a query param there
(unlike `/api/sync`, which is always called programmatically and checks an
`Authorization: Bearer` header instead — a bearer header isn't something a plain
browser navigation can send). The route generates a random `state`, stashes it in a
short-lived httpOnly cookie, and redirects to Strava with the same `state`. Strava's
callback (`GET /api/strava/callback`) checks the returned `state` against the cookie
before exchanging the code — CSRF protection for the handshake, on top of (not instead
of) the secret gate on the initiate step. `redirect_uri` is derived from
`request.nextUrl.origin` (so it's `http://localhost:3000/api/strava/callback` locally
and `https://strava-visualiser.vercel.app/api/strava/callback` in prod) rather than a
separate env var — this only needs the *domain* registered with Strava, not the full
path, per Strava's "Authorization Callback Domain" setting.

Domain code lives in `src/lib/strava/`: `types.ts` (the `StravaClient` interface
shared with ticket 04 and the Strava API DTOs), `api-client.ts` (real fetch-based
implementation, `createStravaApiClient`/`defaultStravaClient`), `oauth.ts` (authorize
URL builder), `credentials.ts` (`getStoredCredentials`/`upsertCredentials`/
`ensureFreshAccessToken`, all taking an injectable Drizzle client), and
`constants.ts` (the state-cookie name). Shared owner-only auth lives in
`src/lib/auth.ts` (`isValidSharedSecret`, `extractBearerToken`).

**Upsert semantics.** `strava_credentials` has no DB-level unique constraint (per the
spec, it's a single-row-by-convention table). `upsertCredentials` implements the
upsert at the application level: select the existing row (if any) and update it,
otherwise insert. Re-running the OAuth flow always converges on exactly one row.

**Testing.** `src/lib/strava/__tests__/credentials.test.ts` exercises
`upsertCredentials`/`ensureFreshAccessToken` against the real dev-branch Postgres
database (no live Strava calls — `refreshAccessToken` is faked). Route-level tests
(`src/app/api/strava/authorize/route.test.ts`,
`src/app/api/strava/callback/route.test.ts`) cover the auth gate, the CSRF state
check, and a mocked-Strava-client happy path. All credential tests snapshot whatever
is in `strava_credentials` before running and restore it afterwards, since it's a
real shared database and the row may later hold a genuine credential. Added `vitest`
as the test runner (`npm run test`, wired through `dotenv-cli` to load `.env.local`
like the other `db:*` scripts); `vitest.config.mts` sets `fileParallelism: false`
because these tests hit one shared real database.

**Resolved.** The owner registered a Strava API app, gave the client id/secret, and
completed the consent flow against the production deployment. `strava_credentials`
in the production DB now holds one real row (`athlete_id: 135858327`). One hiccup
along the way, unrelated to this ticket's code: the schema had only ever been pushed
to the Neon **dev** branch (ticket 01), not **production**, so the first callback
attempt 500'd with `relation "strava_credentials" does not exist` — fixed by running
`drizzle-kit push` against the production connection string. Worth remembering for
any future schema change: push to both branches, not just dev.
