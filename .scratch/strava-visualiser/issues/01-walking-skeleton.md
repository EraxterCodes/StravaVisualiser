# 01 — Walking skeleton: project scaffolding & deployment pipeline

**What to build:** The full deployment pipeline working end-to-end for a trivial page, proving every piece of infrastructure is wired together before any real feature work starts.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Next.js (TypeScript) project initialized with Tailwind CSS configured
- [ ] Public GitHub repository created and pushed (via `gh` CLI)
- [ ] Vercel project created and linked to the repository, auto-deploying on push
- [ ] Neon Postgres project created with a `production` branch and a `dev` branch
- [ ] Drizzle configured and able to connect to Neon — a trivial query succeeds both locally (against the `dev` branch) and from the deployed app (against the `production` branch)
- [ ] A trivial page is live at the Vercel deployment URL
