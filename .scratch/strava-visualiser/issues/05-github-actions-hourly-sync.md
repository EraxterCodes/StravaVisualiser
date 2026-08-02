# 05 — GitHub Actions hourly scheduled sync workflow

**What to build:** The external scheduler that keeps data fresh hourly, working around Vercel Hobby's daily-only cron limit.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A GitHub Actions workflow is scheduled to run hourly (cron trigger)
- [ ] The workflow calls the deployed sync endpoint, authenticating with the shared secret stored as a GitHub Actions secret
- [ ] The workflow also supports manual triggering via `workflow_dispatch`, for verification
- [ ] A manual run successfully triggers a sync against the deployed app, confirmed by updated data or workflow logs
