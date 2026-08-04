# GymFit Roadmap

Updated: 2026-08-04. Historical checkpoints are under `docs/archive/2026-08/` and `logs/`; current documentation is indexed by [`docs/README.md`](docs/README.md).

## Completed

| Workstream | Status | Evidence |
|---|---|---|
| Core gym/auth/RBAC and TASK-001–TASK-007 | COMPLETE | Existing source and historical evidence |
| Coach Program, Assignment and Schedule authoring | COMPLETE | Migration `0007`, Coach module handover |
| Member Workout execution and Progress | COMPLETE | Migration `0008`, Coach module handover |
| Admin Coach list/detail/status | COMPLETE | Migration `0009`, Admin acceptance |
| Admin Member assign/reassign | COMPLETE | Transaction/concurrency/IDOR acceptance |
| Admin Exercise Library | COMPLETE | Create/edit/activate/deactivate acceptance |
| Admin Workout Governance | COMPLETE — READ-ONLY | Programs, Assignments, Schedules, Sessions, Progress acceptance |
| Coach documentation consolidation | COMPLETE | `docs/coach/COACH_MODULE_HANDOVER.md` |

## Blocked

| Workstream | Status | Owner | Action |
|---|---|---|---|
| Full-project clean migration install | BLOCKED_BY_MARKETPLACE_MIGRATION_0100 | Marketplace/Seller | Resolve `SellerApplications` baseline conflict separately |
| Admin Program Builder | BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL | Coach/Admin architecture | Define and test an explicit Admin ownership model before adding features |
| Browser visual verification | BLOCKED_BY_BROWSER_RUNTIME | Verification environment | Run approved browser checklist at 375/768/1440 |

## Next

- Run the real Admin Coach visual checklist when the approved browser runtime is available.
- Keep Coach contracts, migrations and authorization acceptance green.
- Resolve Marketplace migration `0100` only on a separate Marketplace-owned workstream.

Marketplace, Seller, Video, Payment, Refund and Settlement remain protected/out of scope for Coach work.

## Coach appointment delivery

- Public Coach discovery now has one canonical data source and filters inactive or suspended Coaches.
- Booking is a real pending appointment with fixed 60-minute slots, overlap/concurrency protection, ownership checks and lowercase state transitions.
- Member appointment and Coach appointment routes are separate from Workout Schedule routes.
- Migration `0010_coach_profiles.sql` is additive and must be applied only to a disposable/approved target after backup and status verification.
- Browser acceptance is still a required follow-up before claiming a full Coach completion verdict.
