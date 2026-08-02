# 07 — Calendar heatmap

**What to build:** The GitHub-contributions-style calendar heatmap of activity.

**Blocked by:** 02

**Status:** done

- [x] `react-calendar-heatmap` integrated into the dashboard, wired to `/api/heatmap?range=`
- [x] Heatmap cells are colored by daily distance/effort
- [x] Respects the currently selected time-range preset
- [x] Styled to match the site's look (Tailwind overrides as needed)

## Comments

Implemented as `src/components/dashboard/heatmap-section.tsx`. Used `@types/react-calendar-heatmap`
from DefinitelyTyped (`^1.9.0`) — it installed cleanly, no local type shim needed.

The library's default CSS classes (`.color-empty`, `.color-scale-1..4`) are overridden
in `src/app/globals.css` under a scoped `.heatmap` wrapper, remapped to a 6-step
(0–5) sequential blue ramp that recedes toward the dark surface at the low end (level 0
≈ the card background) rather than toward white — the dataviz skill's reference
sequential ramp is built to recede toward a *light* surface, so I hand-picked dark-safe
steps instead (`--seq-0`…`--seq-5` in globals.css) rather than reusing that table
verbatim. Levels are assigned by quantiles of that range's own max daily distance
(`Math.ceil((distanceMeters / maxDistance) * 5)`), so the shading is always relative to
the selected time-range, not a fixed global scale — a quiet month and a big month both
use the full color range. A "Less → More" swatch legend sits under the grid.

The visible date span (`startDate`/`endDate` passed to the library) is derived from the
selected preset: this-year = Jan 1–today, this-month = 1st–today, last-30-days =
today−30–today, all-time = earliest returned activity date–today. Hover shows the exact
date and distance (or "rest day") via the library's native `titleForValue` (browser
tooltip) — good enough for a personal dashboard; a richer custom tooltip would be the
natural upgrade if this ever needs polish.

Verified with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and visually via a
local Playwright screenshot script across all-time / this-year / this-month / last-30-days
and a mobile viewport (heatmap becomes horizontally scrollable below its 640px min-width
rather than squashing).
