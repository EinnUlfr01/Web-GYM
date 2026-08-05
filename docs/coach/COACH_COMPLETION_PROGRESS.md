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
