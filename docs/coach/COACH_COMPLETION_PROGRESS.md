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
