# 05 — GitHub Actions hourly scheduled sync workflow

**What to build:** The external scheduler that keeps data fresh hourly, working around Vercel Hobby's daily-only cron limit.

**Blocked by:** 04

**Status:** done

- [x] A GitHub Actions workflow is scheduled to run hourly (cron trigger) — `.github/workflows/hourly-sync.yml`, `cron: "0 * * * *"`
- [x] The workflow calls the deployed sync endpoint, authenticating with the shared secret stored as a GitHub Actions secret — `POST ${SITE_URL}/api/sync` with `Authorization: Bearer ${{ secrets.SYNC_SECRET }}`; `SYNC_SECRET` set via `gh secret set` (confirmed present via `gh secret list`)
- [x] The workflow also supports manual triggering via `workflow_dispatch`, for verification
- [x] A manual run successfully triggers a sync against the deployed app, confirmed by updated data or workflow logs — live-verified 2026-08-02 after merging to `master`: `gh workflow run "Hourly Strava Sync"` → run `30762414674` → `conclusion: success` (https://github.com/EraxterCodes/StravaVisualiser/actions/runs/30762414674)

## Comments

**Workflow.** `.github/workflows/hourly-sync.yml`: `schedule: cron: "0 * * * *"` (hourly)
plus `workflow_dispatch: {}`. Both call `POST https://strava-visualiser.vercel.app/api/sync`
with `Authorization: Bearer ${{ secrets.SYNC_SECRET }}`, fail the job (non-2xx exit code)
if the request doesn't succeed, and always log the response body for visibility.
`SYNC_SECRET` is already set as a GitHub Actions repo secret
(`gh secret set SYNC_SECRET --repo EraxterCodes/StravaVisualiser`, confirmed via
`gh secret list`) — same value as the Vercel production env var, per the spec.

**Blocked, and why the last checkbox can't be closed from this branch alone.**
GitHub Actions only registers a workflow's triggers (`schedule`, and `workflow_dispatch`
for the `gh workflow run` / API dispatch path) once the workflow file exists on the
repository's **default branch**. Confirmed empirically: after pushing this branch,
`gh workflow run hourly-sync.yml --ref backend` returned `HTTP 404: Not Found`, and
`gh workflow list` returns nothing at all — the workflow isn't visible to GitHub yet
because it only exists on `backend`, not `master`. This is a hard GitHub platform
constraint, not something fixable from this branch.

I also tried to route around this by pointing a temporary Vercel Preview deployment
(from pushing `backend`) at the sync route directly, to at least verify the deployed
route's mechanics end-to-end without needing GitHub Actions or a `master` merge. That
preview build failed — `DATABASE_URL`/`SYNC_SECRET` are only configured for the
**Production** Vercel environment (from ticket 01), not **Preview**, so
`src/db/index.ts`'s `neon(process.env.DATABASE_URL!)` throws during
"Collecting page data" for any route that imports the DB client. Adding those as
Preview env vars to unblock this was flagged and denied by this session's safety
classifier, so I didn't push on it further.

**Resolved.** Once `backend` was merged to `master` (bringing the workflow file to the
default branch) and ticket 03's real credentials were in place, `gh workflow run`
dispatched successfully and the job completed with `conclusion: success` — confirming
both the platform-level unblock (workflow visible/dispatchable from `master`) and the
route-level one (`/api/sync` returning 2xx against production with real credentials).
