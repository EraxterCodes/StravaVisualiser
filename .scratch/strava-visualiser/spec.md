# Strava Data Visualiser

Status: ready-for-agent

## Problem Statement

The user wants a public website that shows off their personal Strava activity data through rich, engaging visualisations — a calendar heatmap, trend charts, fun aggregate stats (total distance, calories, elevation, streaks, etc.), and per-activity route maps. Anyone can view the site; there is exactly one Strava account behind it (the owner's), and visitors never log in or see anyone else's data.

The owner also wants to build this as cheaply as possible (free hosting/DB tiers) and wants the codebase structured so that a "frontend" agent and a "backend/Strava-integration" agent can work on it in parallel against a shared, pre-agreed contract, rather than blocking on each other.

## Solution

A Next.js (TypeScript, Tailwind) site deployed on Vercel's free Hobby tier, backed by a Neon (Postgres) free-tier database. The owner connects their Strava account once via a protected one-time OAuth setup route; from then on, an hourly GitHub Actions scheduled workflow (Vercel Hobby's cron only runs daily, so the schedule lives outside Vercel) calls a protected sync endpoint that pulls new activities from the Strava API into the database. The owner also has a protected manual "refresh now" trigger for on-demand syncs. All visitor-facing pages read only from the database — never live from Strava — so page loads are fast and immune to Strava's API rate limits regardless of traffic.

The dashboard shows a calendar heatmap, summary and "fun" stats (calories, distance/elevation with fun real-world equivalences, longest activity, longest streak, most active day/time, activity count by sport type), trend charts of distance/pace over time, a recent-activities list, and per-activity GPS route maps (Leaflet + OpenStreetMap). Everything is filterable by time-range presets (All-time / This year / This month / Last 30 days).

The codebase is split into two seams to enable parallel work: a domain layer that owns Strava sync and stats aggregation (testable in isolation with a faked Strava client and a real test database), and a typed API contract (a set of Next.js API routes) that the frontend builds against using fixture data, independent of the real backend being finished.

## User Stories

1. As the site owner, I want to connect my Strava account via a one-time protected OAuth setup route, so that the app can access my activity data without exposing this capability to the public.
2. As the site owner, I want my Strava refresh token stored securely in the database, so that the app can keep syncing my data without me re-authenticating every time.
3. As the site owner, I want an hourly scheduled sync (via a GitHub Actions workflow) that pulls my latest Strava activities into the database, so that my dashboard stays reasonably up to date without manual effort.
4. As the site owner, I want the sync and setup endpoints protected by a shared secret, so that only I (or my own scheduled job) can trigger data changes.
5. As the site owner, I want a manual "refresh now" trigger protected by the same shared secret, so that I can force an immediate sync right after finishing an activity instead of waiting for the hourly job.
6. As a site visitor, I want to view a public dashboard showing the owner's Strava stats without needing to log in, so that I can browse their activity data freely.
7. As a site visitor, I want to see a calendar heatmap of activity, colored by distance/effort per day, so that I can visually spot patterns in training frequency.
8. As a site visitor, I want to see summary stats (total distance, elevation gain, moving time, activity count), so that I get a quick overview of overall training volume.
9. As a site visitor, I want to see total calories burned, so that I get a sense of overall effort/energy expenditure.
10. As a site visitor, I want total distance traveled expressed with a fun real-world equivalence (e.g. "x times around the Earth"), so that the number feels more tangible and shareable.
11. As a site visitor, I want total elevation gained expressed with a fun real-world equivalence (e.g. "x times the height of Everest"), so that the number feels more tangible and shareable.
12. As a site visitor, I want to see the longest single activity (by distance and/or duration), so that I can see a standout personal achievement.
13. As a site visitor, I want to see the longest streak of consecutive active days, so that I can appreciate consistency over time.
14. As a site visitor, I want to see the most active day of week and time of day, so that I can understand typical training habits.
15. As a site visitor, I want to see a breakdown of activity count by sport type (run, ride, swim, etc.), so that I understand the mix of activities.
16. As a site visitor, I want to see a trend chart of weekly/monthly distance and pace, so that I can see progress over time.
17. As a site visitor, I want to see a list of recent activities (type, distance, pace, date), so that I can browse the latest training log.
18. As a site visitor, I want to select a specific activity and see its GPS route plotted on a map, so that I can see where the activity took place.
19. As a site visitor, I want to filter all stats and visualisations by a time-range preset (All-time, This year, This month, Last 30 days), so that I can focus on a specific period rather than always seeing all-time totals.
20. As a site visitor, I want the site to load quickly regardless of how many other visitors are browsing at the same time, so that the experience feels fast and isn't affected by Strava's API rate limits.
21. As the site owner, I want the app's data layer to be independently testable without needing a live Strava connection, so that I (or an agent) can build and verify sync/aggregation logic in isolation.
22. As the frontend developer/agent, I want a fixed, typed API contract to build UI components against, so that I can develop and test the frontend using fixture data without depending on the real Strava/database integration being finished.
23. As the backend developer/agent, I want a fixed, typed API contract to implement routes against, so that I can build the sync/aggregation logic independently of the frontend's UI decisions.
24. As the site owner, I want the app deployed on Vercel's free Hobby tier with a Neon free-tier Postgres database, so that hosting costs stay at $0.
25. As the site owner, I want to develop locally against a separate Neon "dev" branch, so that I can iterate without risking production data.
26. As the site owner, I want the GitHub repository to be public, so that I can also show off the implementation, not just the live site.

## Implementation Decisions

- **Stack**: Next.js (TypeScript), Tailwind CSS — matches the owner's existing `MythicPlusScoreCalculator` project.
- **ORM**: Drizzle, targeting Postgres via Neon's serverless driver.
- **Hosting**: Vercel (Hobby/free tier) for the app. Neon (free tier) for Postgres, using branching — a `production` branch for the live deployment, a `dev` branch for local development. No local Postgres/Docker needed.
- **Auth model**: no visitor authentication of any kind. The only protected surface is owner-only, secured by a single shared secret (stored as a Vercel env var and a GitHub Actions secret), checked by the relevant API routes (e.g. `Authorization: Bearer <SYNC_SECRET>`).
- **Strava connection**: OAuth Authorization Code flow. A one-time protected setup route initiates the handshake and persists the resulting access/refresh token and expiry to the database. Exactly one credential ever exists (single-user, single row) — this is explicitly not a multi-tenant credentials table.
- **Data flow**: visitor-facing pages and API routes read only from Postgres — never call the Strava API live on a page load. This keeps page loads fast and immune to Strava's rate limits (200 req/15min, 2000/day) regardless of visitor traffic.
- **Sync mechanism**:
  - Primary: an hourly GitHub Actions scheduled workflow calls a protected sync API route on the deployed app. (Chosen over native Vercel Cron because Vercel's Hobby plan only permits daily-or-less-frequent cron jobs.)
  - Secondary: an owner-only manual "refresh now" trigger, same protection mechanism, callable on demand.
- **Domain layer** (e.g. `lib/activities`): a single module owning both sync (pull from Strava API, upsert into DB) and querying/aggregation (summary stats, fun stats, heatmap data, trend series) for a given time-range. The Strava API client and DB client are both injectable, so the layer can be tested with a faked Strava client against a real (test) database — no live network calls in tests.
- **API contract layer**: typed Next.js API routes that are thin adapters over the domain layer, forming the shared contract between the frontend and backend work. Proposed routes:
  - `GET /api/stats?range=<preset>` → summary + fun stats
  - `GET /api/heatmap?range=<preset>` → calendar heatmap data
  - `GET /api/trends?range=<preset>` → time-series data for trend charts
  - `GET /api/activities?range=<preset>` → recent activities list
  - `GET /api/activities/:id/route` → GPS route/polyline for a single activity's map
  Request/response TypeScript types for these routes should be agreed and written down before frontend and backend work proceeds in parallel — the frontend builds against fixture data matching these types, the backend implements the routes by calling into the domain layer.
- **Time-range presets**: All-time / This year / This month / Last 30 days, applied as a query parameter (`range`) across every stats/visualisation endpoint. No custom date-range picker in v1.
- **Frontend libraries**: Recharts (trend charts), `react-calendar-heatmap` (calendar heatmap), Leaflet + OpenStreetMap tiles (route maps) — all free, no API keys, to keep hosting/tooling costs at $0.
- **Schema (conceptual)**: an `activities` table (one row per Strava activity: distance, elevation gain, moving time, calories, sport type, start date/time, route/polyline data, plus whatever raw fields are needed for the fun stats) and a `strava_credentials` table (single row: access token, refresh token, expiry). Exact column-level design is left to implementation via Drizzle schema definitions.
- **Explicitly not built**: any visitor account/session system, multi-tenant credentials, Strava webhook subscriptions, or paid mapping services.

## Testing Decisions

- Good tests exercise the domain layer's public functions (e.g. `syncActivities`, `getSummaryStats`, `getHeatmapData`, `getTrends`, `getRecentActivities`) through their real interface, not their internals — using a real test database (the Neon `dev` branch or an ephemeral test schema) and a faked/stubbed Strava API client. No live network calls to Strava in tests.
- Frontend components/pages are developed and tested against fixture data conforming to the shared API contract's TypeScript types, independent of the real domain layer or database.
- API routes get thin integration tests confirming they authenticate correctly, call the domain layer as expected, and shape responses per the contract — the substantive logic under test lives in the domain layer, not the routes themselves.
- This is a fresh project with no prior test conventions to follow; this spec establishes the first convention, to be captured in `CONTEXT.md`/ADRs as the domain-modeling skill gets exercised during implementation.

## Out of Scope

- Multi-user support / visitors connecting their own Strava accounts (explicitly deferred; may be added later)
- Custom date-range picker (only the four fixed presets ship in v1)
- Strava webhook-based real-time sync (deferred in favor of hourly polling + manual trigger)
- Mapbox or other paid/keyed map providers
- Year-over-year comparisons, personal-record tracking, segment leaderboards (named during scoping as later additions, not v1)
- Any authentication/session system beyond the single shared secret (no NextAuth, no login page, no user table)
- Custom domain name or branding beyond the default Vercel deployment URL

## Further Notes

- The owner is already authenticated via the GitHub CLI locally, so repo creation and GitHub Actions secret configuration can be automated as part of implementation setup.
- The two-seam split (domain layer + API contract) was deliberately chosen so one agent/session can build the Strava/backend integration while another builds the frontend in parallel, converging on the shared typed contract rather than blocking on each other.
- Project setup (`/setup-matt-pocock-skills`) has already configured this repo for local-markdown issue tracking (`.scratch/`), the default five triage labels, and single-context domain docs (`CONTEXT.md` + `docs/adr/`, to be created lazily as domain-modeling work happens).
