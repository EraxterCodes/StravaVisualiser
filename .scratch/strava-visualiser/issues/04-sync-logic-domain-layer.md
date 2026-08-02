# 04 — Sync logic (domain layer) + protected sync/manual-refresh endpoint

**What to build:** The core data pipeline — pulling real activities from Strava into the database, exposed through a protected endpoint that both an automated job and the owner can trigger.

**Blocked by:** 02, 03

**Status:** ready-for-agent (code complete; final live-data criterion blocked on ticket 03's live verification — see Comments)

- [x] `syncActivities()` in the domain layer fetches activities from the Strava API using the stored credentials and upserts them into the `activities` table — `src/lib/strava/sync.ts`
- [x] The domain layer's Strava client and DB client are both injectable; `syncActivities()` is tested against a faked Strava client and a real test database — no live network calls to Strava in tests — `src/lib/strava/__tests__/sync.test.ts` (10 cases: missing credentials, insert, upsert-on-re-sync, pagination, token refresh)
- [x] A protected API route triggers `syncActivities()`, gated by the shared secret — `POST /api/sync`, verified in `src/app/api/sync/route.test.ts`
- [x] The same protected route (or a thin wrapper around it) can be triggered manually by the owner on demand — same route serves both callers (no separate wrapper needed; see Comments)
- [ ] Running the sync against the real connected Strava account (from ticket 03) pulls real activities into the database — blocked on ticket 03's live OAuth completion (needs owner-supplied `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET`)

## Comments

**`syncActivities()`.** Loads the single stored credential row, refreshes the access
token first if it's expired or within a 5-minute buffer of expiring (persisting the
refreshed token immediately, via `ensureFreshAccessToken` from ticket 03), then pages
through Strava's `GET /athlete/activities` (100/page, capped at 50 pages as a sanity
limit) and upserts every activity via `INSERT ... ON CONFLICT (strava_id) DO UPDATE`.
Returns `{ fetched, upserted }`. Throws a clear error if no credentials are stored yet
(caught by the route handler, surfaced as a 500 with the message), which is also the
expected — and now the actual, verified — failure mode until ticket 03's OAuth is
completed live.

**Known deviation from the schema's aspiration:** Strava's activity *list* endpoint
(the one sync uses) doesn't return `calories` — that's only on the per-activity
*detail* endpoint, which sync deliberately doesn't call per-activity (it would burn
through the 200-req/15-min rate limit fast on any real history). `calories` is stored
as `null` for every synced activity for now. The `calories` column is already
nullable, so nothing else needs to change; if per-activity calorie backfill is wanted
later, it'd be a separate, explicitly rate-limited job, not part of this sync path.

**"Thin wrapper" decision:** the ticket allows a separate manual-trigger wrapper
around the sync route, but there's no meaningful difference between "the hourly job
calls this" and "the owner calls this" — both are just `POST /api/sync` with
`Authorization: Bearer <SYNC_SECRET>`, so a wrapper would add a route with no
behavioral difference. Ticket 05's workflow and an owner's manual `curl` hit the exact
same endpoint.

**Testing.** `sync.test.ts` seeds `strava_credentials` with a valid (or deliberately
expired) row, drives `syncActivities` with an in-memory fake `StravaClient`, and reads
back the `activities` table — all against the real dev-branch Postgres database, using
a `stravaId >= 9_000_000_000_000_000` sentinel range that's astronomically above any
real Strava activity ID so cleanup can't collide with real data. `route.test.ts` for
`/api/sync` mocks `syncActivities` itself (via `vi.mock`) to test the route's own
concerns — auth gating and response shaping — in isolation from the domain logic
that's already covered elsewhere, per the spec's testing decision that routes get
"thin" tests.

**Blocked**, same root cause as ticket 03: the last checkbox needs a real Strava
credential in the database, which needs the owner to register a Strava API app and
complete the OAuth consent screen themselves. Once ticket 03 is live-verified, running
`POST /api/sync` (locally or against the deployed app) against the real account will
satisfy this ticket's remaining checkbox too.
