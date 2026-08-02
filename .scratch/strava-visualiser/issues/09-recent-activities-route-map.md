# 09 — Recent activities list + per-activity route map

**What to build:** The recent-activities log and the GPS route map for a selected activity.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Recent activities list renders (type, distance, pace, date), wired to `/api/activities?range=`
- [ ] Selecting an activity fetches its route via `/api/activities/:id/route`
- [ ] The GPS route renders on a Leaflet map with OpenStreetMap tiles
- [ ] Respects the currently selected time-range preset for the list
