# GymFit Project Status

Updated: 2026-08-03 (Asia/Saigon)

## Snapshot

- Working branch: `fix/vinh-coach-e2e-hardening`.
- Requested baseline: `feat/vinh-coach-member-e2e` at `21f69017b0c4f2f5933998b0382d0676b0e83a16`.
- Canonical database: `GYMFIT_DB`; acceptance databases are disposable and must use a guarded prefix.
- Coach authoring/assignment/schedule migration `0007` is applied and checksum-valid on the canonical database.
- Additive Member Workout migration `0008_member_workout_flow.sql` is applied on the canonical database.
- No acceptance fixtures are intended to remain in `GYMFIT_DB`.

## Coach/Member Workout scope

The current slice covers Coach-owned programs and scoped assignments/schedules plus Member current assignment/program, schedule read, Start Session, immutable exercise snapshot, Set Logs, Complete/Abandon, session history and Progress. Coach monitoring reads real Member sessions, snapshots, set summaries and progress within active CRM/assignment scope.

Hardening addresses flat API contracts, full Set Log CRUD, dedicated progress history and exercise detail, current date-range eligibility, IANA timezone consistency, reassignment lifecycle, dashboard error states and documentation integrity.

## Verification result

All requested Coach/Member gates passed: isolated real-data API/browser acceptance, backend build, frontend production build, frontend TypeScript with only the three pre-existing out-of-scope errors, `git diff --check`, migration status, canonical backup/integrity checks and documentation inventory/link/claim review. Evidence is recorded in [`docs/coach/COACH_END_TO_END_HANDOVER.md`](docs/coach/COACH_END_TO_END_HANDOVER.md) and [`docs/DOCUMENTATION_CLEANUP_REPORT.md`](docs/DOCUMENTATION_CLEANUP_REPORT.md).

## Out of scope and remaining baseline debt

Admin Coach Management, Admin pages, Video, Marketplace, Seller, Payment, Refund and Settlement are unchanged. The only allowed TypeScript failures are:

- `frontend/src/components/products/ProductCard.tsx`
- `frontend/src/pages/reviews/ReviewsPage.tsx`
- `frontend/src/services/reviewsApi.ts`

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for current limitations and [`docs/README.md`](docs/README.md) for canonical documentation.
