# GymFit Project Status

Updated: 2026-08-04 (Asia/Saigon)

## Snapshot

- Working branch: `coach1`.
- Cleanup baseline: `3ed26100f867ccd96cca8b23f19c1b35d1360db0`.
- Canonical database: `GYMFIT_DB`.
- Canonical migration status before applying this change: `21 applied`, `0 pending`, `0 checksum mismatches`; current read-only status is `21 applied`, `1 pending` (`0010_coach_profiles.sql`), `0 checksum mismatches`.
- Coach migrations `0007`, `0008` and `0009` are applied and checksum-valid.
- Acceptance databases are disposable, guarded by prefix and must be dropped after use.
- No acceptance fixtures remain in `GYMFIT_DB`.

## Coach module

The Coach/Member Workout slice and bounded Admin Coach Management are implemented. The canonical handover is [`docs/coach/COACH_MODULE_HANDOVER.md`](docs/coach/COACH_MODULE_HANDOVER.md).

- Coach Workspace: implemented and scoped by JWT/CRM/assignment ownership.
- Member Workout: Start Session, immutable snapshot, Set Logs, Complete/Abandon, history and progress.
- Admin Coach: list/detail/status, assign/reassign and status token invalidation.
- Admin Exercise Library: existing-schema CRUD and activate/deactivate.
- Admin Workout Governance: read-only Programs, Assignments, Schedules, Sessions and Progress.
- Admin Program Builder: `BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL`.

## Verification

- Backend build: PASS.
- Backend lint: PASS, 0 errors with existing warnings.
- Frontend TypeScript: PASS, 0 errors.
- Frontend production build: PASS; existing large-chunk warning remains non-blocking.
- Isolated Admin–Coach–Member acceptance: PASS, including RBAC, IDOR, duplicate assignment, concurrent reassign, history preservation, Exercise status and suspended Coach denial.
- Acceptance database cleanup/drop: PASS.
- Browser visual verification: `BROWSER_VERIFICATION_BLOCKED` because the approved runtime entry point is missing; no browser PASS is claimed.

## Known blockers

- `FULL_PROJECT_CLEAN_INSTALL_BLOCKED_BY_MARKETPLACE_MIGRATION_0100`: a fresh baseline contains `SellerApplications` before migration `0100` creates it. This is owned by Marketplace/Seller work and is outside Coach scope.
- Browser visual verification requires a working approved browser runtime at `375x812`, `768x1024` and `1440x900`.

## Protected scope

Marketplace documentation under `docs/marketplace/**`, Marketplace/Seller backend modules, Video and Auth architecture are protected and unchanged by this cleanup. See [`docs/README.md`](docs/README.md) for the canonical documentation index.

## Next action

Run the visual browser checklist when the approved browser runtime is available. Resolve migration `0100` separately on a Marketplace-owned branch; do not alter it as part of Coach work.

## Coach appointment update

The implementation now includes canonical public Coach APIs, real Member booking, `/appointments`, `/coach/appointments`, fixed Asia/Ho_Chi_Minh slots, overlap/concurrency guards, IDOR-safe ownership and additive `CoachProfiles` migration `0010`. Backend build, frontend typecheck/build, lint (warnings only) and the unit contract test pass. Database/API acceptance remains guarded to isolated databases; browser acceptance has not been run in this environment, so the final status remains partial until those checks pass.
