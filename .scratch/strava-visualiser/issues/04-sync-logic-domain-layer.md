# 04 — Sync logic (domain layer) + protected sync/manual-refresh endpoint

**What to build:** The core data pipeline — pulling real activities from Strava into the database, exposed through a protected endpoint that both an automated job and the owner can trigger.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `syncActivities()` in the domain layer fetches activities from the Strava API using the stored credentials and upserts them into the `activities` table
- [ ] The domain layer's Strava client and DB client are both injectable; `syncActivities()` is tested against a faked Strava client and a real test database — no live network calls to Strava in tests
- [ ] A protected API route triggers `syncActivities()`, gated by the shared secret
- [ ] The same protected route (or a thin wrapper around it) can be triggered manually by the owner on demand
- [ ] Running the sync against the real connected Strava account (from ticket 03) pulls real activities into the database
