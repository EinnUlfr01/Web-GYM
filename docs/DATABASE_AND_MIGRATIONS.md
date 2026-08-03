# Database and Migrations

Status: CANONICAL
Last verified: 2026-08-03

GymFit uses SQL Server. The canonical database is `GYMFIT_DB`; acceptance must never mutate it. The runner in `backend/src/scripts/migrate.ts` reads ordered `db/migrations/NNNN_description.sql` files, applies each migration transactionally and records filename/version/SHA-256 in `SchemaMigrations`. `npm run db:migrate:status` is read-only.

## Current migration contract

| Migration | Purpose | State |
|---|---|---|
| `0001`–`0005` | Commerce foundation, inventory, orders, payment history and reservation metadata | Applied and immutable |
| `0006` | Auth session security and booking-slot uniqueness | Applied and immutable |
| `0007_coach_programs_assignments_schedules.sql` | Coach programs, days, exercises, assignments and schedules | Applied and checksum-valid |
| `0008_member_workout_flow.sql` | Member session, immutable exercise snapshot and set-log tables | Applied and additive |
| `0009_admin_coach_management.sql` | Bounded Coach status/reason fields and status index | New in this branch; apply forward-only |
| `0100`–`0111` | Seller/Marketplace modules | Existing applied range; unchanged by Coach work |

The baseline has 20 applied migrations. After applying this branch, the expected target is 21 applied migrations, 0 pending and 0 checksum mismatches; the exact live result must be captured by the final status command and must not be hard-coded before verification.

## Coach/Member data model

`0007` owns `WorkoutPrograms`, `WorkoutProgramDays`, `WorkoutProgramExercises`, `CoachProgramAssignments` and `CoachProgramSchedules`. `0008` owns `MemberWorkoutSessions`, `MemberWorkoutSessionExercises` and `MemberWorkoutSetLogs`. The snapshot copies exercise identity, name, ordering and targets at Start; later template edits do not rewrite history. Unique constraints protect one session per schedule, one active session per Member and one set number per session exercise.

Member and Coach identity is derived from JWT plus backend scope queries. The current assignment requires `ACTIVE`, its date range to include today in its IANA timezone, and its Coach to match the active `CRMCustomers.assigned_coach_id`. Historical sessions remain preserved even when a CRM scope changes.

`0009` is additive to `Users`: `coach_status` is `ACTIVE|SUSPENDED|INACTIVE`, with an optional bounded reason and timestamp. `SUSPENDED` keeps `is_active=1` for administrative visibility but is rejected by live Coach authentication; `INACTIVE` also sets `is_active=0`. No Coach, Exercise, Program, Assignment, Session or Set Log is hard-deleted.

## Safe migration procedure

1. Query and verify the target database identity.
2. Create and verify a `COPY_ONLY CHECKSUM` backup before mutation.
3. Review the migration SQL, runner status and checksum.
4. Apply forward-only through the normal runner; never edit or renumber an applied file.
5. Re-run status and invariant queries.

Acceptance uses isolated names such as `GYMFIT_DB_COACH_E2E_FIX_<timestamp>` or `GYMFIT_DB_ADMIN_COACH_ACCEPTANCE_<timestamp>`, restored from a verified baseline. Seed deterministic data only there, run API/browser acceptance, clean fixture rows, drop the database and verify it is absent. Never print credentials or secrets.

## Integrity rules

Applied checksums are immutable. No reset, drop or manual migration is a fallback. A checksum mismatch blocks completion. Existing Marketplace migrations and commerce invariants remain outside Coach scope and must be unchanged.
