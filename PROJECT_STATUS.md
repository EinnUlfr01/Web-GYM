# GymFit Project Status

Updated: 2026-07-16 (Asia/Saigon)

## Auth/RBAC hardening (current)

Authentication/RBAC hardening is complete on `hotfix/auth-rbac-hardening`. Migration `0006_auth_session_security.sql` is reserved for session security (token versioning, hashed rotating refresh sessions, session revocation and booking-slot uniqueness), not TASK-008. TASK-008 remains **NOT STARTED** and starts its migration sequence at `0007` after the Discovery Gate.

## Current baseline

- Current branch: `feat/dashboard-ui-redesign`
- TASK-007 final base: `007c-order-management` at `427ad52996961648ffc622ca1bf2999a5aab3df4`
- Documentation canonicalization starts from commit `a330c93e73566631fc7d043b3d5c0a26d9e81b72`.
- Canonical database: `GYMFIT_DB`
- Applied migrations: `0001`–`0006`
- Overall project: **IN PROGRESS**

| Work item | Status |
|---|---|
| TASK-001 through TASK-006 | COMPLETE |
| TASK-007 | COMPLETE — `FULL_TASK_007_COMPLETE` |
| TASK-008 specification | COMPLETE |
| TASK-008 implementation | NOT STARTED |

TASK-007 runtime, authorization/IDOR, real Bank/QR, real Gmail, authenticated Customer browser and authenticated Admin browser acceptance passed. Acceptance data was cleaned and canonical database integrity passed.

Verified canonical counts after dashboard acceptance: Products 167, ProductVariants 167, Inventory 167, ProductImages 1, Users 16, Orders 1, PaymentStatusHistory 0. User 16 was preserved as a legitimate public registration created before dashboard acceptance; it does not match acceptance fixture conventions.

## TASK-008

TASK-008 was previously cancelled/out of scope, then approved for reactivation after full TASK-007 completion as **WORKOUT PROGRAM AND MEMBER PROGRESS**. AI, camera, pose estimation and automatic rep counting remain excluded.

Current blocker: none. Exact next action: execute the [TASK-008 Discovery Checklist](docs/TASK-008_DISCOVERY_CHECKLIST.md), record REUSE/EXTEND/REPLACE/DEPRECATED decisions, and only then design migration `0006`. No TASK-008 code or migration exists yet.

## Authoritative files

- Current state: this file
- Next work: [ROADMAP.md](ROADMAP.md)
- Technical index: [docs/README.md](docs/README.md)
- TASK-007 proof: [docs/TASK-007_FINAL_HANDOFF.md](docs/TASK-007_FINAL_HANDOFF.md)
- TASK-008 scope: [docs/TASK-008_IMPLEMENTATION_SPEC.md](docs/TASK-008_IMPLEMENTATION_SPEC.md)
- Database rules: [docs/DATABASE_AND_MIGRATIONS.md](docs/DATABASE_AND_MIGRATIONS.md)

Auth/RBAC closure: manual browser acceptance PASS on `5502`/`5501`; temporary resources and isolated database were cleaned up; canonical Products 167, Users 15, Orders 1 and no acceptance fixtures were verified.

## Coach Member Workout E2E — 2026-08-03

- Branch: `feat/vinh-coach-member-e2e`, starting commit `9d784e6`.
- Canonical `GYMFIT_DB`: 20 applied migrations, 0 pending, 0 checksum mismatches. `0007` checksum is unchanged; `0008_member_workout_flow.sql` is applied.
- Member flow: current assignment/program, schedules, schedule detail, Start Session, immutable exercise snapshot, set CRUD while in progress, Complete, Abandon, session history and Progress.
- Coach flow: existing scoped monitoring now reads real Member sessions, snapshots, set summaries and progress. Coach write behavior remains limited to the existing authoring/assignment/schedule APIs.
- Isolated acceptance databases were cleaned, dropped and verified absent. Backend build and frontend production build pass; frontend TypeScript retains only the three recorded pre-existing errors.

Dashboard UI redesign: `GYMFIT COMMAND CENTER` is complete on `feat/dashboard-ui-redesign` as frontend-only. Authenticated Member, Coach and Admin desktop/mobile flows, account switching, route guards and isolated cleanup passed. The prior login failure was a test-harness/process-context defect; direct backend, explicit Vite proxy and React form login passed without a source fix. Admin data is typed and VND-formatted; Coach unavailable states are truthful; Member data remains self-scoped. See [dashboard design system](docs/DASHBOARD_DESIGN_SYSTEM.md).

Canonical migration closure: backup checksum/VERIFYONLY PASS; migrations `0001–0006` applied to `GYMFIT_DB`; pending `0`, checksum mismatches `0`. Refresh uses JSON `{refreshToken}`; rotation, old-token replay rejection, family revocation, logout revocation, refresh-after-logout `401`, and old-access-token `401` all passed. The orphan smoke session was safely revoked; active AuthSessions is `0`. TASK-008 is unblocked; next action is the Discovery Gate and migration `0007`.
