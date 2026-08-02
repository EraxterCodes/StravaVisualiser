# 04 — Sync logic (domain layer) + protected sync/manual-refresh endpoint

**What to build:** The core data pipeline — pulling real activities from Strava into the database, exposed through a protected endpoint that both an automated job and the owner can trigger.

**Blocked by:** 02, 03

**Status:** done

- [x] `syncActivities()` in the domain layer fetches activities from the Strava API using the stored credentials and upserts them into the `activities` table — `src/lib/strava/sync.ts`
- [x] The domain layer's Strava client and DB client are both injectable; `syncActivities()` is tested against a faked Strava client and a real test database — no live network calls to Strava in tests — `src/lib/strava/__tests__/sync.test.ts` (10 cases: missing credentials, insert, upsert-on-re-sync, pagination, token refresh)
- [x] A protected API route triggers `syncActivities()`, gated by the shared secret — `POST /api/sync`, verified in `src/app/api/sync/route.test.ts`
- [x] The same protected route (or a thin wrapper around it) can be triggered manually by the owner on demand — same route serves both callers (no separate wrapper needed; see Comments)
- [x] Running the sync against the real connected Strava account (from ticket 03) pulls real activities into the database — live-verified 2026-08-02: `POST /api/sync` against production returned `{"fetched":92,"upserted":92}`, all 92 real activities landed in the `activities` table

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

**Calorie backfill (added post-launch, 2026-08-02):** the owner reported "Calories
burned: 0 kcal" on the live dashboard — the deviation noted above (list endpoint
omits `calories`) was real but shipped without a fix. Added a bounded backfill: for
each synced activity still missing `calories`, `syncActivities` calls the per-activity
*detail* endpoint (`StravaClient.getActivityDetail`), capped at
`MAX_CALORIE_BACKFILLS_PER_SYNC = 20` per run, prioritizing Strava's newest-first list
order. A pre-sync lookup (`getExistingCalories`) skips activities that already have a
stored value, so the backfill drains a large backlog gradually (a few sync runs) while
staying cheap forever after (new activities are 0-2/hour, well under the cap). A failed
detail call (rate limit, transient error) is caught and left `null` for the next sync
to retry, rather than failing the whole sync. Verified live: 5 manual sync runs fully
backfilled all 92 activities (20/20/20/20/12), `totalCalories` went from `0` to
`28884`. 3 new tests cover backfill-on-missing, skip-if-already-set, and the
20-per-run cap (`src/lib/strava/__tests__/sync.test.ts`).

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

**Resolved.** Real sync run against production pulled 92 activities — all real, all
`Ride`/`VirtualRide` (this athlete's Strava history is entirely cycling). This surfaced
a real-world contract mismatch not visible from fixture data: Strava's actual
`sport_type` vocabulary (`VirtualRide`, `TrailRun`, `GravelRide`, etc.) is far larger
than the fixed `SportType` union the frontend's categorical color mapping depends on
(spec ticket 06). Handled in ticket 10 via a normalization function
(`src/lib/strava/sport-type.ts`) applied at the query boundary, not by widening the
public contract — `VirtualRide` buckets into `Ride`, etc. See ticket 10 for the rest of
the real-data wiring.
