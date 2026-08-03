# Known Limitations

Status: CANONICAL
Last verified: 2026-08-03

- The current task implements the minimum Coach/Member Workout business flow. Measurement tracking, medical diagnosis, nutrition, wearables, AI recommendations, camera/pose estimation, automatic rep counting and live coaching remain out of scope.
- Reassignment has a reusable transactional domain function and an ADR, but no Admin UI or public reassignment route is added in this Coach-only task.
- Legacy `WorkoutSessions` remain a separate historical source. Coach monitoring can show legacy rows with an explicit blocked set-summary reason; new Member Workout rows provide snapshot/set/progress facts.
- Frontend has no lint script. The production build may emit a non-blocking Vite large-chunk advisory.
- Exactly three frontend TypeScript errors remain pre-existing and outside this task: `ProductCard.tsx`, `ReviewsPage.tsx` and `reviewsApi.ts`.
- Browser acceptance uses disposable deterministic data and must not create fixtures in `GYMFIT_DB`. Marketplace authenticated journeys and payment integrations remain governed by their own supporting documentation.
- Browser-local token persistence remains a compatibility constraint. A future cookie/CSP redesign requires a separate CSRF/security task.
