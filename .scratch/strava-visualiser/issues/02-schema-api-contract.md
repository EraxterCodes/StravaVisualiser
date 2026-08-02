# 02 — Schema & API contract (stub routes on fixtures)

**What to build:** The shared contract that lets backend and frontend work proceed in parallel — the database schema and the typed API routes, initially serving fixture data so the frontend has something real to build against immediately.

**Blocked by:** 01

**Status:** done

- [x] Drizzle schema defines an `activities` table (distance, elevation gain, moving time, calories, sport type, start date/time, route/polyline data, and any other fields the fun stats need) — `src/db/schema.ts`
- [x] Drizzle schema defines a `strava_credentials` table (single row: access token, refresh token, expiry) — `src/db/schema.ts`
- [x] TypeScript request/response types are defined and documented for all five API routes — this is the shared contract the frontend and backend build against independently — `src/types/api.ts`
- [x] `GET /api/stats?range=<preset>` returns fixture data matching its type, for each of the four time-range presets
- [x] `GET /api/heatmap?range=<preset>` returns fixture data matching its type
- [x] `GET /api/trends?range=<preset>` returns fixture data matching its type
- [x] `GET /api/activities?range=<preset>` returns fixture data matching its type
- [x] `GET /api/activities/:id/route` returns fixture route data matching its type

## Comments

Fixture data lives in `src/fixtures/activities.ts` (20 realistic activities spanning ~11 months)
and is aggregated by shared helpers in `src/lib/stats.ts` and `src/lib/time-range.ts` — the same
helpers the real domain layer (ticket 04) can reuse or mirror once it's querying the real DB
instead of the fixture array. An invalid/missing `range` query param falls back to `all-time`
rather than erroring. Verified all five routes locally via `npm run dev` + curl, and confirmed
`npm run build` and `npm run lint` are both clean.
