# 03 — Strava OAuth one-time setup route

**What to build:** The one-time flow that lets the owner connect their own Strava account, persisting a real credential the sync logic can later use.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A protected route (gated by the shared secret) initiates the Strava OAuth Authorization Code flow
- [ ] Completing the flow exchanges the authorization code for an access token and refresh token
- [ ] The resulting token and expiry are persisted to the `strava_credentials` table (single row; re-running the flow upserts it)
- [ ] Hitting the route without the correct shared secret is rejected
