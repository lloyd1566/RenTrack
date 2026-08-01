# Task: Keep Render Free Instance Awake (no "Service waking up" screen)

## Steps

- [x] 1. Created `app/api/health/route.ts` — lightweight health-check endpoint (no DB calls)
- [x] 2. Created `render.yaml` — Render Blueprint with web service + `*/10 * * * *` cron job that pings `/api/health` every 10 minutes
- [x] 3. Build verified: ✅ `npx next build` PASSED (26 routes, `/api/health` included)
- [ ] 4. Deploy via Render Blueprint (push repo to GitHub → Render Dashboard → New → Blueprint → select repo) and replace `https://renttrack.onrender.com` with your actual URL in `render.yaml`

> Note: The cron keep-alive pings every 10 min so the free instance stays warm (free tier spins down after ~15 min idle). For a 100% guaranteed instant load, the Render Starter plan keeps the instance always-on with zero spin-down.

# Task: Admin/Owner Built-in Account & Role Filtering

## Steps

- [x] 1. Analyze codebase and create plan
- [x] 2. `lib/db.ts` — Add `findOrCreateAdmin` helper function (also UPDATES existing admin password to `adminOwner`)
- [x] 3. `app/api/init/route.ts` — Seed built-in admin account on DB init
- [x] 4. `app/login/page.tsx` — Remove "owner" and "admin" from signup roles, keep only "agent" and "tenant"
- [x] 5. `app/api/auth/signup/route.ts` — Reject admin/owner signup attempts
- [x] 6. Build verified: ✅ `npx next build` PASSED

## Landing Page

- [x] 1. "Dashboard" nav link → points to landing page top (`/`)
- [x] 2. Added "Units" nav link → scrolls to units preview section (`#dashboard-preview`)
- [x] 3. Units section now fetches real units from `/api/data/units` (no static sample data)
- [x] 4. Shows "No Units Yet" empty state when database has no units
- [x] 5. Handles both camelCase and snake_case DB field names
- [x] 6. Build verified: ✅ `npx next build` PASSED
