# Coach1 Completion Progress

## Scope guard

- Target branch: `coach1`
- Scope: Coach modules, Coach-facing Membership/Entitlement/Booking, Member Workout, Admin Coach and related acceptance coverage.
- Explicitly out of scope: Marketplace Backend, Seller Backend, migrations `0100`–`0111`, framework/database changes, microservices, AI, realtime chat and video call.
- Existing user-owned untracked files were preserved.

## Phase 00 — Workspace safety and baseline

Status: PASS

Baseline captured on 2026-08-05 before Coach implementation changes.

### Repository

- Branch: `coach1`
- HEAD: `5944d17 feat(ui): stabilize shell and overhaul dashboard UX`
- Tracked worktree: clean before this checkpoint.
- Existing untracked plan/prompt files: preserved and not staged.

### Baseline evidence

- Backend build: PASS (`npm run build`).
- Backend lint: PASS with 0 errors and 452 existing warnings.
- Frontend typecheck: PASS (`npx tsc --noEmit`).
- Frontend build: PASS (`npm run build`).
- Booking unit test: PASS (`npm run test:coach-booking-unit`).
- Migration status: PASS/read-only. Target `GYMFIT_DB` has 22 applied migrations, 0 pending migrations and 0 checksum mismatches. Coach migration `0010_coach_profiles.sql` is applied.
- Marketplace/Seller migrations `0100`–`0111` are present and applied in the existing database; no source or migration changes were made to them.

### Acceptance execution note

Role, member E2E, Admin Coach and Booking acceptance scripts require isolated disposable databases through their environment guards. They were not run against the canonical database during this baseline checkpoint.

## Reporting convention

Each subsequent phase records its status, changed files, database/API/frontend impact, RBAC/IDOR checks, concurrency checks, test evidence, risks and checkpoint commit here. A phase is not marked PASS until its required build/test/scope checks complete.

## Phase 01 — Domain rules and ADR

Status: PASS

Added the canonical Coach domain contract and focused ADRs for Membership entitlement/quota, Availability and Program Versioning. The contract fixes Asia/Ho_Chi_Minh boundaries, reservation-based quota with no cancellation refund, explicit pending-payment confirmation, availability-versus-booking responsibilities, immutable snapshots, private context scope, notification limits and API error semantics.

Runtime tests were not required for this documentation-only phase. `git diff --check` passed before checkpointing.

## Phase 02 — Migration 0010 readiness and database guard

Status: PASS

- Canonical target: `GYMFIT_DB`.
- `npm run db:migrate:status`: 22 applied, 0 pending, 0 checksum mismatches.
- `0010_coach_profiles.sql`: APPLIED with matching checksum.
- `COACH_MIGRATION_VERIFY`: PASS; `CoachProfiles` exists and has two unique indexes.
- No migration file was created or rewritten. Migrations `0100`–`0111` were not changed.

The existing verification script already supplied the required Coach migration evidence, so no script change was necessary in this phase.

## Phase 03 — Schedule date model and generation

Status: PASS (implementation and compile checks)

- Schedule generation now uses the assignment start date as the relative week anchor.
- Requested generation dates are bounded by assignment start, current Coach timezone date, assignment end date and Program duration.
- The response now includes requested/effective range, `toDate`, `horizonDays`, `inserted` and `skipped` counts.
- Serializable generation and the existing `(assignment, program_day, scheduled_date)` idempotency guard remain in place.
- The Coach role acceptance fixture now covers bounded range and supplemental generation preserving assignment-relative week numbers.

Checks: backend build PASS; targeted ESLint PASS with two existing `no-explicit-any` warnings in the acceptance script; booking unit PASS; frontend typecheck/build PASS after the Schedule DTO/UI update. Disposable acceptance execution remains part of the integrated acceptance run.

## Phase 04 — Overdue Schedule reconciliation

Status: PASS (implementation and compile checks)

- Added a bounded Coach overdue service and interval runner.
- Only `SCHEDULED` rows older than the assignment timezone's current date are eligible.
- Rows with a Member Workout Session are excluded; `IN_PROGRESS`, `COMPLETED` and `CANCELLED` are never changed.
- Updates are conditional and idempotent; the runner has a single-flight guard, batch limit and error logging.
- The runner is disabled for isolated Coach acceptance environments and does not alter the existing order-expiration runner.
- Member E2E acceptance now verifies an overdue schedule becomes `SKIPPED` without a Session.

Checks: backend build PASS; targeted ESLint PASS; acceptance fixture compiles. Disposable execution remains part of integrated acceptance because the script requires an isolated Coach E2E database.

## Phase 05 — Session completion integrity

Status: PASS (implementation and compile checks)

- `COMPLETE` now requires at least one Session Exercise and one completed Set with at least one measurement.
- `ABANDON` remains valid for an empty/in-progress Session; not every target must be completed.
- Session and Schedule updates now verify affected rows inside the existing serializable transaction.
- Added stable error code `SESSION_HAS_NO_COMPLETED_WORK` on the 409 response.
- Member UI disables Complete until completed measured work exists while retaining backend enforcement.
- Member E2E acceptance now checks empty completion rejection.

Checks: backend build PASS; targeted lint PASS; frontend typecheck/build PASS; booking unit PASS. Disposable Member E2E remains part of integrated acceptance.

## Phase 06 — Immutable Exercise snapshot after source deactivation

Status: PASS (implementation and compile checks)

- Member Session start no longer filters `Exercises.is_active`; an Exercise already referenced by a Program Day is still copied into the immutable `MemberWorkoutSessionExercises` snapshot.
- The selectable Coach/Admin catalog continues to require an active source Exercise, so deactivation does not make the Exercise available for new Program edits.
- The Member E2E fixture now uses a dedicated Exercise slug, deactivates that source after the first Session, and verifies a later Session still receives the source name/id snapshot. Cleanup remains safe for reruns.
- Admin Exercise routes were reviewed: they support soft deactivate/activate and do not expose a source Exercise hard-delete route.

Checks: backend build/lint and frontend typecheck/build are required before checkpoint; booking unit and disposable Member E2E remain part of integrated acceptance. No migration was created.

## Phase 07 — Source-aware Session identity

Status: PASS (implementation and compile checks)

- Coach Session detail now accepts the discriminated route `/coach/members/:memberId/sessions/:source/:sessionId`, with `source` limited to `member` or `legacy`.
- The old numeric-only route remains a compatibility path only: it serves a unique source and returns `SESSION_SOURCE_REQUIRED` with HTTP 409 when both sources contain the same numeric ID. It never silently falls back after an explicit source was supplied.
- Dashboard, progress, list and detail links carry the source; frontend Session types and API client are source-aware. Member/legacy rows keep distinct React keys.
- Source checks are ownership-scoped before data is returned. Acceptance fixtures cover the valid legacy route, valid member route, wrong-source 404 and unambiguous legacy compatibility route.

Checks: backend build PASS; targeted ESLint PASS with two pre-existing `no-explicit-any` warnings in `coach-role-acceptance.ts`; frontend typecheck/build PASS; booking unit PASS. No migration was created.

## Phase 11 — Server-side pagination foundation

Status: PASS (implementation and compile checks)

- Coach Workspace `listSessions` now performs the legacy/member `UNION ALL`, ordering, count and `OFFSET/FETCH` in SQL Server. It no longer loads both complete histories and slices them in memory.
- Session rows retain the source discriminator, set summary and legacy blocked reason while using the same `{items,page,limit,total,totalPages}` contract as the other Coach Workspace lists.
- Public Coach list now exposes normalized `items` while preserving the existing `coaches` alias and pagination metadata for current callers.
- Added a reusable frontend pagination control and wired Coach Programs, Exercise Library, Members, Assignments, Schedules, Sessions and Admin Workout Governance to server page/filter state. Search/filter changes reset to page 1 and list views no longer request 50 records as an implicit full fetch.
- Admin Coach and Admin Exercise services were already SQL-paginated and were kept compatible; no migration or query index was added without Phase 28 query-plan evidence.
- Scope review: no Marketplace/Seller source or migration `0100`–`0111` changed.

Checks: backend build PASS; backend lint PASS with the existing 452 `no-explicit-any` warnings and zero errors; `test:coach-booking-unit` PASS; frontend typecheck PASS; frontend build PASS with the existing large-chunk warning. Disposable list fixtures with more than one page remain part of the integrated acceptance run.

## Phase 09 — Program Builder integrity and save semantics

Status: PASS (implementation and compile checks)

- Reworked the Coach Program Builder Exercise editor to keep edits local until an explicit `Save targets` action; PATCH is no longer sent for every keystroke.
- Added visible fields for target weight, duration, tempo and Coach note alongside sets/reps/rest, with dirty/saved/saving states and server-backed validation.
- Added client validation for the reps/duration requirement and min/max ordering while retaining the route's Zod validation and existing SQL columns from migration `0007`.
- A per-Exercise revision guard prevents a late save response from clearing a newer local draft. Double submit is disabled while a save is active.
- Program Day add/reorder/delete, Exercise add/reorder/delete and Program detail save remain available; the UI only touches Coach-owned resources through existing endpoints.

Checks: backend build PASS; targeted backend ESLint PASS; frontend typecheck/build PASS; booking unit PASS. No migration was created.

## Phase 10 — Safe Program Day editing

Status: PASS (implementation and compile checks)

- Backend Day create/update validates week 1–104 and day 1–7 even when called below the route layer.
- SQL Server unique violations for `(program_id, week_number, day_number)` are normalized to HTTP 409 `PROGRAM_DAY_POSITION_CONFLICT` instead of leaking raw SQL errors.
- A Day's week/day position cannot be changed after it has a Schedule reference; title and description metadata remain editable. Delete continues to map FK references to a stable 409.
- Program Builder now exposes explicit Day week/day/title/description editing with a `Save Day` action, dirty/saved state and no per-keystroke PATCH. Add Day caps the local next-day suggestion at 7.
- Role acceptance covers duplicate positions, invalid Day 8, scheduled position lock and safe metadata edit.

Checks: backend build PASS; targeted ESLint PASS; frontend typecheck/build PASS; booking unit PASS. No migration was created.

## Phase 08 — Assignment lifecycle and transition concurrency

Status: PASS (implementation and compile checks)

- The canonical transition map is now `ACTIVE → PAUSED|COMPLETED|CANCELLED` and `PAUSED → ACTIVE|COMPLETED|CANCELLED`; terminal states remain terminal.
- Transition reads the scoped Assignment with `UPDLOCK,HOLDLOCK`, checks the expected current status, and performs `UPDATE ... WHERE id AND coach_id AND status=@expectedStatus` inside a serializable transaction. Resume rejects a second active Assignment for the same Member.
- Completing or cancelling an Assignment conditionally closes its remaining `SCHEDULED` rows as `CANCELLED`; pausing prevents new Member Sessions through the existing assignment-status guard, while resume preserves the assignment's schedules.
- Role acceptance now covers concurrent pause/resume/complete, invalid repeated transition and no remaining scheduled rows after terminal transition. Existing Admin reassignment remains transactional and separate.

Checks: backend build PASS; targeted ESLint PASS with two pre-existing `no-explicit-any` warnings in `coach-role-acceptance.ts`; frontend typecheck/build PASS; booking unit PASS. No migration was created.
