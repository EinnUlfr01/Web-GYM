# GymFit Roadmap

Updated 2026-07-15. Older roadmap statements that cancelled TASK-008 are superseded.

## Security hardening interlock

Auth/RBAC hardening occupies migration `0006` and is independent of TASK-008. TASK-008 remains not started; its first possible migration number is now `0007`, only after its Discovery Gate.

## Completed foundation

| Task | Status | Outcome |
|---|---|---|
| TASK-001 through TASK-006 | Complete | Core gym, authentication, roles, membership, operational and catalog foundations |
| TASK-007A | Complete | Product/image, variant and inventory foundation |
| TASK-007B | Complete | Admin catalog, variant, inventory and order management |
| TASK-007C | Complete | Variant checkout, orders, payment, reservation, Gmail/Bank and lifecycle acceptance |

## TASK-008 — WORKOUT PROGRAM AND MEMBER PROGRESS

TASK-008 was reopened after FULL TASK-007 acceptance. Its implementation has not started.

1. **008A — Exercise Library and Workout Programs.** Discovery resolved; migration `0006`; Exercise/Program APIs, ownership rules, program builder and Admin/Coach UI; Build Gate A passes.
2. **008B — Member Assignments and Workout Sessions.** Coach-Member scope decided; migration `0007`; assignments, schedules, immutable session snapshots, set logs and Member workout flow; authorization/concurrency acceptance and Build Gate B pass.
3. **008C — Member Progress and Final Project Acceptance.** Migration `0008` only if manual measurements require it; progress formulas/API/UI; privacy, timezone, browser, isolated-DB and final build acceptance pass.

Dependencies and gates: branch from the auth/RBAC closure; complete the [Discovery Gate](docs/TASK-008_DISCOVERY_CHECKLIST.md) before `0007`; never edit applied migrations; use isolated acceptance databases; update documentation before handoff.

Out of scope: AI, camera, pose estimation, automatic rep counting, medical diagnosis, nutrition, wearables, social feed/gamification expansion, live coaching, and new payment work.

Final project completion requires all three subtasks, migrations and checksums, backend/frontend build gates, authorization/IDOR/concurrency tests, Admin/Coach/Member browser acceptance, acceptance cleanup, canonical DB integrity, documentation, commit, and branch push.

Auth/RBAC closure: manual browser acceptance and offline cleanup passed; no browser automation was rerun.

Canonical migrations `0001–0006` are applied and auth/RBAC closure is complete. TASK-008 remains not started; it is unblocked and its next action is the Discovery Gate, followed by migration `0007` if required.

Dashboard UI redesign is complete and authenticated browser-accepted for Member, Coach and Admin at desktop/mobile breakpoints, including account switching and route guards. The isolated acceptance environment was removed. This frontend-only workstream does not start TASK-008 or change backend contracts.

## Coach E2E completion update — 2026-08-03

The approved Coach business slice is complete on the local branch: migration `0007` remains checksum-valid, additive migration `0008_member_workout_flow.sql` is applied, and the minimum Member Workout Flow is available. The accepted scope is limited to Coach monitoring plus Member assignment/schedule, session snapshot, set logs, Complete/Abandon and Progress. Admin Coach Management, Video, Marketplace, Seller, Payment, Refund and Settlement remain out of scope.
