# 08 — Trend charts

**What to build:** Charts showing distance and pace trends over time.

**Blocked by:** 02

**Status:** done

- [x] Recharts chart of distance over time (weekly or monthly buckets), wired to `/api/trends?range=`
- [x] Recharts chart of pace over time, wired to the same endpoint
- [x] Respects the currently selected time-range preset

## Comments

Implemented as `src/components/dashboard/trends-section.tsx` — two separate single-axis
Recharts charts side by side (stacked on mobile), never a dual-axis chart: a rounded-cap
bar chart for distance (blue, `maxBarSize={24}`, 4px top radius per the dataviz mark
spec) and a line chart for pace (orange, 2px stroke, 4px dots with a surface-color ring).
Each is a single series, so per the dataviz skill's legend rule neither needs a legend
box — the card title + subtitle already say what's plotted.

The pace chart's Y-axis is `reversed` (lower seconds/km — faster — plots higher), which
reads naturally ("higher point = better pace") and is called out explicitly in the
subtitle ("lower is faster") so it's not ambiguous. Bucket granularity mirrors what
`/api/trends` actually returns (`lib/stats.ts`'s `computeTrends`: weekly for
this-month/last-30-days, monthly otherwise) — the section subtitle reflects this
("weekly"/"monthly bucket") but doesn't drive it; the frontend just labels whatever
buckets the API sent.

One implementation note for future reference: Recharts' `<Bar>`/`<Line>` `fill`/`stroke`
props are plain SVG presentation attributes, not routed through Tailwind/PostCSS — I
initially wired them to the same `var(--series-blue)` CSS custom properties used
elsewhere, and in one manual browser check the `<Line>` stroke resolved the CSS
variable fine but the `<Bar>` fill did not reliably render across a full-page
screenshot capture (turned out to be a screenshot-timing/ResizeObserver quirk with
`ResponsiveContainer`, not a real CSS bug — confirmed by inspecting the rendered SVG,
which had the correct resolved color and geometry the whole time). Kept the CSS-variable
approach since it did work correctly on inspection; noting this in case a future agent
sees a similarly "empty-looking" Recharts screenshot — re-check with a cropped
screenshot or DOM inspection before assuming the color is broken, and give
`ResponsiveContainer` a moment (or a manual scroll-through) before capturing a
full-page shot.

Verified with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and visually (all
four range presets, including empty-state handling when a range has no activities).
