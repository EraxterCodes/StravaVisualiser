# 03 — Strava OAuth one-time setup route

**What to build:** The one-time flow that lets the owner connect their own Strava account, persisting a real credential the sync logic can later use.

**Blocked by:** 02

**Status:** ready-for-agent (code complete; live verification blocked on owner-supplied Strava API credentials — see Comments)

- [x] A protected route (gated by the shared secret) initiates the Strava OAuth Authorization Code flow — `GET /api/strava/authorize?secret=<SYNC_SECRET>`
- [ ] Completing the flow exchanges the authorization code for an access token and refresh token — `GET /api/strava/callback` is implemented and verified against a faked Strava client (route test), but not yet exercised against the real Strava API — blocked, see Comments
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

**Blocked.** Strava requires a human to register an API application at
https://www.strava.com/settings/api (I can't do this — it needs the owner's Strava
login) and to click through the consent screen at `/api/strava/authorize` (also
requires the owner's Strava login). Both are pending `STRAVA_CLIENT_ID`/
`STRAVA_CLIENT_SECRET` and an Authorization Callback Domain from the owner — see the
final report for what's needed. Once supplied, `.env.local` needs
`STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` filled in, the same two need adding as
Vercel production env vars, and the owner needs to visit
`/api/strava/authorize?secret=<SYNC_SECRET>` once (locally or in prod) to complete
the real handshake — at which point this ticket's remaining checkbox can be verified
and Status flipped to `done`.
