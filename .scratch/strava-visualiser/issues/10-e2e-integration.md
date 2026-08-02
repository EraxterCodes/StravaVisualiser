# 10 — End-to-end integration: live data on the deployed site

**What to build:** The final convergence of the two seams — proving the whole thing works for a real visitor against real data, not fixtures.

**Blocked by:** 04, 05, 06, 07, 08, 09

**Status:** done

- [x] Frontend (tickets 06–09) confirmed working against real synced data instead of fixtures
- [x] Full flow verified on the actual Vercel deployment: OAuth connect → hourly/manual sync → dashboard displays real, correct data
- [x] All four time-range presets verified to return correct results against real data
- [x] No fixture data remains wired into any production code path

## Comments

**The real wiring.** Added `src/lib/strava/query.ts` (`getStoredActivities`,
`getActivityRouteById`), which reads the `activities` table and shapes rows into the
same `StatsActivity` interface (`src/types/activity.ts`, factored out of
`src/fixtures/activities.ts`'s old `FixtureActivity` so both fixture and real data
share one shape) that `src/lib/stats.ts`'s aggregation functions already consumed —
so `computeStats`/`computeHeatmap`/`computeTrends` needed zero changes beyond a type
rename. All five API routes (`stats`, `heatmap`, `trends`, `activities`,
`activities/:id/route`) now call `getStoredActivities`/`getActivityRouteById` instead
of `FIXTURE_ACTIVITIES` — grepped the whole `src/` tree afterward to confirm nothing
in a route or the domain layer still references the fixture module.

**Two things only real data surfaced:**
1. **Sport-type mismatch.** Strava's real `sport_type` vocabulary (`VirtualRide`,
   `TrailRun`, `GravelRide`, …) is much larger than the fixed `SportType` union the
   frontend's categorical color mapping depends on. Added
   `src/lib/strava/sport-type.ts` (`normalizeSportType`) to bucket Strava's real types
   into the fixed set at the query boundary — this owner's account turned out to be
   100% `Ride`/`VirtualRide`, both correctly bucketing to `Ride`.
2. **`mostActiveTimeOfDay` was hardcoded** to `"Morning"` in the fixture stub (flagged
   by ticket 06's agent as not-my-scope-to-fix). Now computed for real from each
   activity's timestamp — added `startDateTime` to `StatsActivity` (fixtures default it
   to a fixed 08:00 UTC; real data uses the actual synced `start_date`) and a
   time-of-day bucketing function in `lib/stats.ts`. Noted in code that this is
   UTC-based, not the athlete's true local time, since Strava's list endpoint's
   `start_date` is UTC and the sync doesn't currently capture `start_date_local` — a
   reasonable approximation for a personal dashboard, not worth a schema change right
   now.

**A real deployment bug this ticket caught.** The Neon schema had only ever been
pushed to the `dev` branch (ticket 01), never `production` — invisible until the real
OAuth callback tried to write to `strava_credentials` on production and got
`relation "strava_credentials" does not exist`. Fixed with `drizzle-kit push` against
the production connection string. Worth remembering for any future schema change.

**Full live verification, in order:**
1. Owner registered a Strava API app and completed `/api/strava/authorize` against
   production — `strava_credentials` row confirmed written (athlete id `135858327`).
2. `POST /api/sync` against production → `{"fetched":92,"upserted":92}` — 92 real
   activities (all cycling) landed in `activities`.
3. All five API routes spot-checked against production with real data: `/api/stats`
   across all four range presets (including `this-month`, which is correctly empty —
   confirms the empty-state path works with real data, not just fixtures),
   `/api/activities` (real activity names/dates), `/api/heatmap` (88 distinct days),
   `/api/activities/1/route` (real decoded GPS coordinates), and a 404 for a
   nonexistent activity id.
4. Dashboard page itself (`GET /`) confirmed 200 on production.
5. `gh workflow run "Hourly Strava Sync"` dispatched successfully post-merge, run
   `30762414674`, `conclusion: success`.

Nothing outstanding — the site is live at https://strava-visualiser.vercel.app
showing this owner's real Strava data, refreshed hourly.
