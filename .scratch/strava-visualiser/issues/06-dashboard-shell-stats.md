# 06 — Dashboard shell: time-range selector + summary/fun stats

**What to build:** The main dashboard page shell, the time-range selector every other visualisation will share, and the summary/fun stats display.

**Blocked by:** 02

**Status:** done

- [x] Main dashboard page renders with a time-range selector (All-time / This year / This month / Last 30 days)
- [x] Changing the selector re-fetches from `/api/stats?range=` and updates the displayed values
- [x] Summary stats are displayed: total distance, elevation gain, moving time, activity count
- [x] Fun stats are displayed: total calories burned, total distance with a fun real-world equivalence, total elevation with a fun real-world equivalence, longest activity, longest streak, most active day/time, activity count by sport type
- [x] Built and verified against the fixture data from ticket 02 — no dependency on the real backend being finished

## Comments

Implemented as `src/components/dashboard/dashboard.tsx`, mounted from `src/app/page.tsx`
(this replaces the ticket-01 walking-skeleton placeholder page — its DB connectivity
check was a one-time infra proof, not a permanent feature, so it made way for the real
dashboard). The time-range preset lives in a small React context
(`src/lib/time-range-context.tsx`, `TimeRangeProvider`/`useTimeRange`) so every section
(stats, heatmap, trends, activities) shares one selector — `src/components/dashboard/time-range-selector.tsx`.
Data fetching goes through a small shared hook, `src/lib/use-fetch-json.ts`, which
re-fetches on URL change and — per the dataviz-skill interaction guidance — keeps the
previous render in place (dimmed to 50% opacity) while a new range loads, instead of
flashing a skeleton or blanking the view.

Design: went dark-mode-only (no light/dark toggle) rather than "dark-mode-friendly" —
an athletic/analytics dashboard (Strava, Vercel, Linear, GitHub-in-dark-mode) reads
naturally dark-first, and it halved the CSS surface area versus theming both modes.
Colors are the dataviz-skill's validated dark-mode categorical/sequential palette,
wired in as CSS custom properties in `src/app/globals.css` and mapped into Tailwind's
`@theme inline`. Sport types get a **fixed** hue→sport mapping (Run=blue, Ride=orange,
Swim=aqua, Hike=yellow, Walk=magenta, Other=green) that never changes based on which
sports appear in the selected range, per the "assign categorical hues in fixed order"
rule.

One thing worth flagging for whoever picks up ticket 10 (real-data integration): the
fixture's `mostActiveTimeOfDay` is hardcoded to `"Morning"` in `src/lib/stats.ts`
(not computed from real timestamps) — that's ticket 02's fixture stub, not something
I can fix here since `lib/stats.ts` is out of my scope, but the real domain layer will
need to actually compute it from activity start times.

Verified via `npx tsc --noEmit`, `npm run lint`, `npm run build` (all clean), and by
running the dev server and driving it with a local, git-ignored Playwright script
(installed with `npm install --no-save`, not added to package.json) to screenshot the
full dashboard, a range switch, and a mobile (390px) viewport, plus checking
`console --errors` was empty throughout.
