# 09 — Recent activities list + per-activity route map

**What to build:** The recent-activities log and the GPS route map for a selected activity.

**Blocked by:** 02

**Status:** done

- [x] Recent activities list renders (type, distance, pace, date), wired to `/api/activities?range=`
- [x] Selecting an activity fetches its route via `/api/activities/:id/route`
- [x] The GPS route renders on a Leaflet map with OpenStreetMap tiles
- [x] Respects the currently selected time-range preset for the list

## Comments

Implemented as `src/components/dashboard/activities-section.tsx` (list + selection
state) and `src/components/dashboard/route-map.tsx` (the actual Leaflet map). Used
`react-leaflet` v5 (requires React 19, which this project is already on) +
`leaflet` + `@types/leaflet`. The map component is loaded via `next/dynamic` with
`ssr: false` from the parent — Leaflet touches `window`/`document` at import time, so
it must never be evaluated during SSR/static generation. `leaflet/dist/leaflet.css` is
imported once globally in `src/app/globals.css`, with a small dark-chrome override for
the zoom control and attribution box (the tiles themselves stay the standard OSM
raster look, per OSM's tile usage policy — no dark tile style, since that would need a
different, possibly keyed, tile provider).

The list auto-selects the most recent activity on load and whenever the range changes
(selection reset is computed during render by comparing the fetched data reference,
per React's "adjusting state when a prop changes" pattern — not in a `useEffect` — to
satisfy the `react-hooks/set-state-in-effect` lint rule that `eslint-config-next@16`
now enforces). Only 2 of the 20 fixture activities carry `coordinates` (ids `1` and
`2`, per `src/fixtures/activities.ts`'s comment); selecting any other activity shows a
"No GPS data available for this activity" empty state in the route panel instead of an
empty/broken map — verified this explicitly since it's the common case for real Strava
data too (indoor activities, treadmill runs, etc. have no GPS trace).

Route rendering: `Polyline` for the track, plus a green `CircleMarker` at the start and
a red one at the end (chose circle markers over Leaflet's default pin icon
specifically to avoid the well-known bundler/Next.js "broken marker icon" issue with
`L.Icon.Default`'s asset paths — no icon-fix workaround needed). The map fits its
bounds to the route with `boundsOptions={{ padding: [24, 24] }}` and has
`scrollWheelZoom={false}` so it doesn't hijack page scroll.

Verified with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and visually — took
screenshots (via a local, git-ignored Playwright script, not committed) of the
default-selected route, of switching to a second GPS-bearing activity (route swaps
correctly), and of selecting a non-GPS activity (empty state renders correctly) —
`console --errors` was empty throughout.
