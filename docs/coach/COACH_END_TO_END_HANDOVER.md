# Coach business E2E handover

Date: 2026-08-03
Branch: `feat/vinh-coach-member-e2e`
Start commit: `9d784e6d8444797aff071410f049097ab646dd08`

## Delivered scope

The minimum Coach business chain is now executable end-to-end:

`Coach Program -> active Assignment -> dated Schedule -> Member Start Session -> immutable Exercise Snapshot -> Set Logs -> Complete/Abandon -> Member Progress -> Coach read-only monitoring`

Member routes are self-scoped from the JWT. The frontend provides `/workouts`, `/workouts/program`, `/workouts/schedule`, `/workouts/schedule/:scheduleId`, `/workouts/sessions`, `/workouts/sessions/:sessionId`, `/progress`, `/progress/sessions`, and `/progress/exercises/:exerciseId`. The existing Member Dashboard has a small Workout widget and the existing Coach workspace displays real Member session/snapshot/set/progress data.

## Data model and migration gate

- `0007_coach_programs_assignments_schedules.sql`: applied and checksum-valid (`4034f50d41a3aedc0c241fd2eb2a793df39cb503cacd87222d29c4582c93ec03`).
- `0008_member_workout_flow.sql`: additive migration, applied through the migration runner (`ea5a461f462af62b548e486fef8d62666c5c753ae0da7785affba4b3853e6c93`).
- New tables: `MemberWorkoutSessions`, `MemberWorkoutSessionExercises`, `MemberWorkoutSetLogs`.
- `MemberWorkoutSessionExercises` copies program targets and names at Start; later Coach edits do not rewrite the snapshot.
- Unique constraints/indexes enforce one session per schedule, one active session per member and one set number per session exercise.

Canonical `GYMFIT_DB` final status: 20 applied migrations, 0 pending, 0 checksum mismatches. A COPY_ONLY CHECKSUM backup and `RESTORE VERIFYONLY WITH CHECKSUM` passed before applying `0008`. The backup is outside the workspace at the SQL Server backup path and was intentionally retained for recovery.

## State rules

- Start: only an active assignment, `SCHEDULED` schedule, due today in the assignment's IANA timezone, and no other member `IN_PROGRESS` session.
- Complete: `IN_PROGRESS -> COMPLETED`; the schedule becomes `COMPLETED` in the same transaction.
- Abandon: `IN_PROGRESS -> ABANDONED`; the schedule becomes `SKIPPED` in the same transaction.
- Set logs are writable only while the session is `IN_PROGRESS`. Terminal sessions are read-only.
- Concurrent duplicate starts produce one winner and one `409`; concurrent duplicate set numbers produce one insert and one `409`.

## Progress rules

Progress counts completed Member sessions, sums stored completed duration, and computes training volume as `reps * weight_kg` for completed sets with both metrics. Completion rate is completed due schedules divided by due non-cancelled schedules, including today and excluding future schedules. Timestamps are UTC; due-day comparisons use each assignment's IANA timezone. Invalid, incomplete, cancelled, future and abandoned execution facts do not contribute completed metrics.

## Acceptance evidence

- `npm run acceptance:coach-member-e2e`: PASS in isolated `GYMFIT_DB_COACH_E2E_ACCEPTANCE_20260803`; cleanup and `DROP_VERIFY_PASS` completed.
- `npm run acceptance:coach-role`: PASS in isolated `GYMFIT_DB_COACH_ACCEPTANCE_20260803`; cleanup and `DROP_VERIFY_PASS` completed.
- Acceptance covered guest/member/coach role boundaries, Coach A/B scope, Member A/B IDOR, concurrent starts, duplicate set conflict, Complete/Abandon, snapshot integrity, Coach real data visibility and progress formula.
- Browser smoke at `http://localhost:5173`: Member dashboard and all Member workout/progress routes render; 375x800, 768x900 and 1440x1000 checks reported no horizontal overflow and no internal-server-error UI state.
- Backend `npm run build`: PASS.
- Frontend `npm run build`: PASS with the existing Vite chunk-size advisory.
- Frontend `npx tsc --noEmit --pretty false`: only the three pre-existing errors remain in `ProductCard.tsx`, `ReviewsPage.tsx`, and `reviewsApi.ts`; they were not changed.

## Out of scope

No Admin Coach Management, Video Library, Marketplace, Seller, Payment, Refund or Settlement work was added. No canonical migration was reset/dropped, no migration was manually applied, and no push was performed.

## Handoff commands

```powershell
cd backend
$env:DB_NAME='GYMFIT_DB'
npm run db:migrate:status
npm run build
```

Run the acceptance scripts only with their required isolated database prefix and `COACH_ACCEPTANCE=1`. Do not point acceptance cleanup scripts at `GYMFIT_DB`.
