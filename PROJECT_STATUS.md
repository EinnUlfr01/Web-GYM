# GymFit Project Status

Updated: 2026-08-03 (Asia/Saigon)

## Snapshot

- Working branch: `feat/vinh-admin-coach-management`.
- Start baseline: `fix/vinh-coach-e2e-hardening` at `90140f5`.
- Canonical database: `GYMFIT_DB`; acceptance databases are disposable and must use a guarded prefix.
- Coach authoring/assignment/schedule migration `0007` is applied and checksum-valid on the canonical database.
- Additive Member Workout migration `0008_member_workout_flow.sql` is applied on the canonical database.
- Additive Admin Coach migration `0009_admin_coach_management.sql` is pending on the canonical database; it was applied and checksum-verified on disposable acceptance databases only.
- No acceptance fixtures are intended to remain in `GYMFIT_DB`.

## Admin Coach Management scope

The current branch adds dedicated Admin routes and pages for Coach list/detail/status, CRM Member assign/reassign through the existing reassignment service, Admin Exercise CRUD/status, and read-only Workout Governance across Programs, Assignments, Schedules, Sessions and Progress. Migration `0009_admin_coach_management.sql` adds only bounded Coach status fields; its live applied/checksum state must be verified on the target database before release.

## Coach/Member Workout scope

The current slice covers Coach-owned programs and scoped assignments/schedules plus Member current assignment/program, schedule read, Start Session, immutable exercise snapshot, Set Logs, Complete/Abandon, session history and Progress. Coach monitoring reads real Member sessions, snapshots, set summaries and progress within active CRM/assignment scope.

Hardening addresses flat API contracts, full Set Log CRUD, dedicated progress history and exercise detail, current date-range eligibility, IANA timezone consistency, reassignment lifecycle, dashboard error states and documentation integrity.

## Verification result

The Admin backend acceptance passed on an isolated database, including authorization, exercise create, assign/reassign, concurrent scope safety, Member execution, governance reads and suspended-Coach denial. Backend and frontend production builds passed; frontend TypeScript still reports only the three pre-existing out-of-scope errors. Admin browser verification is blocked because the available Browser plugin is missing its required runtime entry point. Canonical `GYMFIT_DB` remains fixture-free with 20 applied migrations, 0 checksum mismatches and `0009` pending. Evidence is recorded in [`docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md`](docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md) and [`docs/coach/COACH_END_TO_END_HANDOVER.md`](docs/coach/COACH_END_TO_END_HANDOVER.md).

## Out of scope and remaining baseline debt

Video, Marketplace, Seller, Payment, Refund and Settlement are unchanged. The only allowed TypeScript failures are:

- `frontend/src/components/products/ProductCard.tsx`
- `frontend/src/pages/reviews/ReviewsPage.tsx`
- `frontend/src/services/reviewsApi.ts`

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for current limitations and [`docs/README.md`](docs/README.md) for canonical documentation.
