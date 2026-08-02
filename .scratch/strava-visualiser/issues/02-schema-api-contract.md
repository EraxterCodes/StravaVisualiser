# 02 — Schema & API contract (stub routes on fixtures)

**What to build:** The shared contract that lets backend and frontend work proceed in parallel — the database schema and the typed API routes, initially serving fixture data so the frontend has something real to build against immediately.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Drizzle schema defines an `activities` table (distance, elevation gain, moving time, calories, sport type, start date/time, route/polyline data, and any other fields the fun stats need)
- [ ] Drizzle schema defines a `strava_credentials` table (single row: access token, refresh token, expiry)
- [ ] TypeScript request/response types are defined and documented for all five API routes — this is the shared contract the frontend and backend build against independently
- [ ] `GET /api/stats?range=<preset>` returns fixture data matching its type, for each of the four time-range presets
- [ ] `GET /api/heatmap?range=<preset>` returns fixture data matching its type
- [ ] `GET /api/trends?range=<preset>` returns fixture data matching its type
- [ ] `GET /api/activities?range=<preset>` returns fixture data matching its type
- [ ] `GET /api/activities/:id/route` returns fixture route data matching its type
