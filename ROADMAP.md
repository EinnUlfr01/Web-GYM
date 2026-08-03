# GymFit Roadmap

Updated 2026-08-03. This file is a current workstream view; historical checkpoints are archived under `docs/archive/2026-08/` and `logs/`.

## Completed foundation

| Workstream | Status | Evidence |
|---|---|---|
| Core gym/auth/RBAC and TASK-001–TASK-007 | COMPLETE | Existing module handovers and migration ledger |
| Coach program, assignment and schedule authoring | COMPLETE | Migration `0007`, Coach handover |
| Member Workout minimum flow | COMPLETE | Migration `0008`, Coach E2E handover |

## Active: Admin Coach Management completion

| Workstream | Status | Owner | Dependency | Gate | Next action |
|---|---|---|---|---|---|
| Flat session/progress contracts | COMPLETE | Coach slice | `0007`/`0008` applied | API/browser acceptance PASS | Maintain contract tests |
| Set Log CRUD and terminal rules | COMPLETE | Coach slice | Member session snapshot | API/browser acceptance PASS | Maintain contract tests |
| Progress history/exercise detail | COMPLETE | Coach slice | Completed Member sessions | API/browser acceptance PASS | Maintain contract tests |
| Assignment/date/timezone/reassignment policy | COMPLETE | Coach slice | CRM scope | API/concurrency acceptance PASS | Maintain lifecycle ADR |
| Documentation cleanup | COMPLETE | Repository | Inventory/governance | Link/claim/hygiene scan PASS | Update canonical docs when contracts change |

| Admin Coach list/detail/status | IN PROGRESS | `0009` + Admin routes | Admin-only authorization | Backend/frontend build and acceptance | Run isolated Admin–Coach–Member acceptance |
| Admin assign/reassign | IN PROGRESS | Existing reassignment service | CRM scope + active Coach | Concurrency/IDOR acceptance | Verify old assignment pause and history preservation |
| Admin Exercise Library | IN PROGRESS | Existing `Exercises` schema | Admin-only mutations | CRUD/status acceptance | Verify no snapshot mutation |
| Admin Workout Governance | IN PROGRESS | `0007`/`0008` + legacy sessions | Read-only Admin routes | Query/authorization acceptance | Verify five tabs and filters |

## Explicitly out of scope for this workstream

Video Library, Marketplace, Seller, Payment, Refund, Settlement, and the three pre-existing frontend TypeScript errors.

## Delivery gates

Backend build, frontend TypeScript with only the three recorded baseline errors, frontend production build, focused Coach regression, isolated real-data acceptance, responsive browser checks at 375/768/1440, migration `0007` checksum/status verification, canonical database integrity and documentation link/secret/hygiene scans. No acceptance fixture may be written to `GYMFIT_DB`, and no push is automatic.
