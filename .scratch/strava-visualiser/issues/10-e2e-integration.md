# 10 — End-to-end integration: live data on the deployed site

**What to build:** The final convergence of the two seams — proving the whole thing works for a real visitor against real data, not fixtures.

**Blocked by:** 04, 05, 06, 07, 08, 09

**Status:** ready-for-agent

- [ ] Frontend (tickets 06–09) confirmed working against real synced data instead of fixtures
- [ ] Full flow verified on the actual Vercel deployment: OAuth connect → hourly/manual sync → dashboard displays real, correct data
- [ ] All four time-range presets verified to return correct results against real data
- [ ] No fixture data remains wired into any production code path
