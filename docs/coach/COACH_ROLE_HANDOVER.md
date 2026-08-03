# Coach-only Role Handover

## FINAL VERDICT

`PARTIALLY_COMPLETE`

The Coach-only surface is implemented and verified. The verdict remains
partial because the repository has no Member-generated set-log/session flow for
newly assigned Programs. Coach session/progress reads therefore expose the
compatible legacy data only and return `BLOCKED_BY_MEMBER_WORKOUT_FLOW` for
missing Member-generated evidence. No Member flow was built to bypass that
blocker.

## BRANCH

`feat/vinh-coach-role-only`

## START COMMIT

`54015ae9638ec9f722e171c01a0ca69533ba907d`

## END COMMIT

`9b006e5` (Coach implementation commit; the documentation handover is the
follow-up commit).

## MIGRATIONS

- Added `db/migrations/0007_coach_programs_assignments_schedules.sql`.
- Applied and verified only in disposable database
  `GYMFIT_DB_COACH_ACCEPTANCE_202608031300` (19 applied, 0 pending, 0
  checksum mismatches during acceptance).
- The canonical `GYMFIT_DB` was not mutated: 18 applied, 1 pending, 0
  checksum mismatches. This is intentional until the migration owner applies
  `0007` through the normal backup/approval process.
- Existing applied migrations, including `0100`–`0111`, were not edited.

## FILES CHANGED

Coach implementation is limited to the Coach workspace, the Coach migration,
Coach acceptance evidence, Coach documentation, and unavoidable shared route /
sidebar registration:

- Backend: `backend/src/modules/coach-workspace/**`,
  `backend/src/scripts/coach-role-acceptance.ts`, `backend/src/app.ts`, and
  the Coach acceptance script entry in `backend/package.json`.
- Database: `db/migrations/0007_coach_programs_assignments_schedules.sql`.
- Frontend: `frontend/src/pages/coaches/**` for the new/updated Coach pages,
  `frontend/src/services/coachWorkspaceApi.ts`,
  `frontend/src/types/coachWorkspace.ts`, and shared Coach route/sidebar/title
  registration in `frontend/src/App.tsx`,
  `frontend/src/components/layout/Sidebar.tsx`, and
  `frontend/src/components/layout/Layout.tsx`.
- Docs: `docs/coach/COACH_ROLE_DISCOVERY_REPORT.md` and this handover.

## COACH FEATURES COMPLETED

- Coach Dashboard with scoped counts, upcoming schedules and truthful blocked
  monitoring state.
- Authenticated, read-only active Exercise list/detail with bounded search,
  filters and sort.
- Coach-owned Program CRUD and Program Builder for metadata, Days, Exercises,
  targets and bounded reorder operations.
- Scoped assigned Member list/detail using the existing active CRM assignment.
- Program assignment, lifecycle management and deterministic timezone-aware
  Schedule generation/reschedule/cancel operations.
- Scoped read-only Session History and Progress pages over compatible legacy
  data; no Member session or set-log writes.
- Coach routes, navigation, role guard coverage, responsive layout and
  ownership/authorization enforcement.

## OUT_OF_SCOPE FILES VERIFIED UNCHANGED

No Admin pages, Member Dashboard, Member workout/session/set-log/progress
pages, Video Library, membership packages, Marketplace, Seller, payment,
refund, settlement, or their business-logic/migration files were changed.
The public presentation `WorkoutPrograms.tsx` and existing CRM/Booking
business logic were left unchanged.

## TESTS RUN

- Backend TypeScript build: PASS (`npm run build`).
- Frontend production build: PASS (`npm run build`; only the existing Vite
  large-chunk warning was emitted).
- `git diff --check`: PASS.
- Coach acceptance suite on isolated database: PASS for guest/member RBAC,
  owner spoof rejection, Program/Member/Assignment/Session scope, cross-Coach
  IDOR, concurrent duplicate Assignment protection, concurrent idempotent
  Schedule generation, legacy monitoring reads and truthful blocked progress.
- Acceptance cleanup: PASS; acceptance users/programs/assignments/schedules
  were removed before the isolated database was dropped.

## BUILD RESULTS

Backend and frontend builds pass on the final Coach implementation. The
backend acceptance runner is guarded by `COACH_ACCEPTANCE=1` and an isolated
`GYMFIT_DB_COACH_ACCEPTANCE_*` database name.

## SECURITY RESULTS

All `/api/coach/*` handlers require authentication and `coach` role
authorization. Coach and Member ownership are derived from the authenticated
JWT and active CRM scope; client-supplied `coach_id`, `owner_coach_id` and
similar identity fields are rejected. Out-of-scope resources are concealed as
404 responses.

## IDOR RESULTS

Coach A cannot read or edit Coach B Programs, read Coach B assignments, read
Coach B Members, assign Coach B Members, or read their session history. Coach B
cannot read Coach A assignments. Member and guest access to Coach APIs is
denied.

## CONCURRENCY RESULTS

Serializable assignment creation with locking and a filtered unique active
assignment index produced exactly one `201` and one `409` under concurrent
duplicate requests. Schedule generation is bounded, deterministic and
idempotent under concurrent duplicate requests.

## BROWSER RESULTS

Browser matrix passed for Coach A desktop/mobile flows covering Dashboard,
Exercise Library/detail, Programs/Builder, scoped Members, Assignment,
Schedule, Session History and Progress. Coach B saw only Coach B Program;
Member A was redirected to access denied; Guest was redirected to login; the
mobile viewport had no horizontal overflow; browser console errors were empty.

## DATABASE CLEANUP

The disposable acceptance database was cleaned, dropped and verified absent.
The API/frontend dev servers were stopped. The SQL Server backup file was
created outside the workspace under the SQL Server Backup directory; deletion
from this session was not permitted by the host file policy and is the only
remaining disposable artifact to remove with the SQL Server host account.

## CANONICAL DB INTEGRITY

Canonical status after implementation: foundation/tracking tables present, 18
applied migrations, 1 pending Coach migration, and 0 checksum mismatches.
Canonical commerce counts and applied migration checksums remained unchanged.

## BLOCKERS

`BLOCKED_BY_MEMBER_WORKOUT_FLOW`: the current repository does not generate
Member sessions, set logs, exercise snapshots or training-volume facts for new
Coach assignments.

## REMAINING ISSUES

The new Program assignment cannot display Member-generated session/set-level
progress until the separately owned Member workout flow exists. Migration
`0007` must be applied to the intended canonical environment through the
approved database process before deploying the new Coach API.

## DOCUMENTATION UPDATED

- `docs/coach/COACH_ROLE_DISCOVERY_REPORT.md`
- `docs/coach/COACH_ROLE_HANDOVER.md`

## NEXT ACTION

Review and apply migration `0007` to the intended environment using the normal
verified-backup workflow, then coordinate with the Member-workout owner to
replace the truthful blocked monitoring fields with real Member-generated
session/set-log data. Do not expand this Coach-only branch into Member work.
