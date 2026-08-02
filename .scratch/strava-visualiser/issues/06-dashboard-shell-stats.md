# 06 — Dashboard shell: time-range selector + summary/fun stats

**What to build:** The main dashboard page shell, the time-range selector every other visualisation will share, and the summary/fun stats display.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Main dashboard page renders with a time-range selector (All-time / This year / This month / Last 30 days)
- [ ] Changing the selector re-fetches from `/api/stats?range=` and updates the displayed values
- [ ] Summary stats are displayed: total distance, elevation gain, moving time, activity count
- [ ] Fun stats are displayed: total calories burned, total distance with a fun real-world equivalence, total elevation with a fun real-world equivalence, longest activity, longest streak, most active day/time, activity count by sport type
- [ ] Built and verified against the fixture data from ticket 02 — no dependency on the real backend being finished
