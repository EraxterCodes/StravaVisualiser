# 01 — Walking skeleton: project scaffolding & deployment pipeline

**What to build:** The full deployment pipeline working end-to-end for a trivial page, proving every piece of infrastructure is wired together before any real feature work starts.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Next.js (TypeScript) project initialized with Tailwind CSS configured
- [x] Public GitHub repository created and pushed (via `gh` CLI) — https://github.com/EraxterCodes/StravaVisualiser
- [x] Vercel project created and linked to the repository, auto-deploying on push
- [x] Neon Postgres project created with a `production` branch and a `dev` branch
- [x] Drizzle configured and able to connect to Neon — a trivial query succeeds both locally (against the `dev` branch) and from the deployed app (against the `production` branch)
- [x] A trivial page is live at the Vercel deployment URL — https://strava-visualiser.vercel.app

## Comments

Node was upgraded from v20.9.0 to v24.18.1 (LTS) system-wide to fix `neonctl`'s
credential-saving bug, which needed Node >=20.19.0. Vercel CLI was upgraded
from 33.5.0 to 58.4.4 for the same class of issue. Neon project `strava-visualiser`
created in `aws-eu-central-1`; default branch renamed `main` -> `production`, with
a `dev` branch created off it. `vercel git connect` failed repeatedly from the CLI
with a generic error even after granting the Vercel GitHub App repo access; connecting
the same repo via the Vercel dashboard (Project Settings -> Git) succeeded where the
CLI didn't.
