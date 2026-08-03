# GymFit Coach Module Handover

Status: `PARTIALLY_COMPLETE`

The Coach/Member/Admin Coach implementation is verified through code review, migration status, builds, TypeScript, lint and isolated Admin–Coach–Member acceptance. Real visual browser verification remains blocked because the available browser runtime is missing its required entry point. This document is the single current handover for the Coach, Member Workout and Admin Coach slices.

## 1. Current status

- Coach Workspace: implemented.
- Member Workout Flow: implemented with additive execution tables.
- Admin Coach Management: implemented with Admin-only list/detail/status and Member assign/reassign.
- Admin Exercise Library: implemented against the existing `Exercises` schema.
- Admin Workout Governance: implemented as read-only visibility.
- Browser verdict: `BROWSER_VERIFICATION_BLOCKED`; no visual PASS is claimed.
- Admin Program Builder: intentionally blocked because the existing ownership model is Coach-owned only.
- Full-project clean install: blocked by the pre-existing Marketplace/Seller migration `0100` conflict; this is outside Coach scope.

## 2. Branch and commits

Repository: `https://github.com/EinnUlfr01/Web-GYM`

Current branch: `coach1`

Relevant implementation history:

- Implementation: `232df83e4dfc5766b65289e925f25cf8d4f6914d` — Admin Coach Management.
- Verification: `4f4d7134e79db47570880e03fb65d956882cba96` — final Coach verification fixes and evidence.
- Cleanup: `d1523a29896c4b47a0ea73fab213ca2dbf65d9dd` — temporary prompt/package removal and stale reassignment comment.
- Current branch tip before this documentation cleanup: `3ed26100f867ccd96cca8b23f19c1b35d1360db0`.

The final documentation-cleanup commit is recorded in the final terminal report after the explicit commits for this task.

## 3. Coach Workspace

Coach authoring and monitoring use the existing Coach routes and services. A Coach owns Programs, Program Days and Program Exercises, creates assignments and schedules for active CRM-scoped Members, and reads only the active Coach scope. Coach status is checked by backend authentication; `SUSPENDED` and `INACTIVE` Coaches cannot access Coach Workspace.

## 4. Member Workout Flow

Migration `0008_member_workout_flow.sql` adds the Member-owned execution model without replacing the `0007` Coach tables or legacy workout tables:

- Member starts a due schedule through a serializable transaction.
- Start creates an immutable exercise snapshot.
- Set Logs capture Member set-level input while the session is active.
- Complete/Abandon move the session and schedule to terminal states.
- Member session history and progress remain self-scoped.

## 5. Admin Coach Management

Admin has a dedicated list/detail surface for Coach operations:

- List and detail Coach records with safe fields and operational counts.
- Change `ACTIVE`, `SUSPENDED` and `INACTIVE` status with a bounded reason.
- Status changes increment `token_version`; suspended/inactive Coach tokens are rejected by live backend authentication.
- Assign an unassigned Member using the existing CRM scope service.
- Reassign a Member through the existing transactional `reassignMemberCoach` operation.
- Preserve old assignment/session/progress history while creating one new active scope.

## 6. Admin Exercise Library

Admin can list, search, filter, paginate, create, edit and activate/deactivate shared Exercises. Fields are limited to the existing schema. Deactivation is soft status management; there is no hard delete and no snapshot mutation.

## 7. Admin Workout Governance

Admin Workout Governance exposes read-only views for:

- Programs
- Assignments
- Schedules
- Sessions
- Progress

There are no Admin mutation routes for Program, Session, Snapshot, Set Log or Coach-owned runtime data.

## 8. Routes

Frontend routes:

- `/admin/coaches`
- `/admin/coaches/:coachId`
- `/admin/exercises`
- `/admin/workouts`

Backend prefixes:

- `/api/admin/coaches`
- `/api/admin/exercises`
- `/api/admin/workouts`

## 9. API endpoints

Admin Coach:

- `GET /api/admin/coaches`
- `GET /api/admin/coaches/summary`
- `GET /api/admin/coaches/:coachId`
- `PATCH /api/admin/coaches/:coachId/status`
- `GET /api/admin/coaches/:coachId/members`
- `GET /api/admin/coaches/coach-members/unassigned`
- `POST /api/admin/coaches/:coachId/members/:memberId/assign`
- `POST /api/admin/coaches/:coachId/members/:memberId/reassign`

Admin Exercise:

- `GET|POST /api/admin/exercises`
- `GET|PATCH /api/admin/exercises/:exerciseId`
- `POST /api/admin/exercises/:exerciseId/activate`
- `POST /api/admin/exercises/:exerciseId/deactivate`

Admin Governance:

- `GET /api/admin/workouts/programs`
- `GET /api/admin/workouts/assignments`
- `GET /api/admin/workouts/schedules`
- `GET /api/admin/workouts/sessions`
- `GET /api/admin/workouts/progress`

## 10. Migrations 0007, 0008 and 0009

- `0007_coach_programs_assignments_schedules.sql`: Coach-owned Programs, assignments and schedules.
- `0008_member_workout_flow.sql`: additive Member session, snapshot and Set Log tables.
- `0009_admin_coach_management.sql`: bounded Coach status fields, constraint and index.

Canonical `GYMFIT_DB` verification recorded `21 applied`, `0 pending` and `0 checksum mismatches`; `0007`, `0008` and `0009` have matching checksums. Acceptance databases are disposable and use guarded names only.

Migration `0100_seller_application_role_foundation.sql` is separately blocked on a fresh baseline because `SellerApplications` already exists. That Marketplace/Seller issue is documented in `docs/marketplace/MIGRATION_0100_BASELINE_CONFLICT.md` and is not fixed here.

## 11. Authorization and RBAC

Backend authorization is authoritative. Admin routes require authentication and `UserRole.ADMIN`; Guest receives `401`, Coach and Member receive `403`. Frontend route guards and menus are navigation UX only. Ownership is derived from JWT identity and backend scope queries.

## 12. Assign/reassign rules

- Assign locks the active Member/CRM row and rejects an existing active Coach scope with `409`.
- Reassign uses serializable transaction isolation and locks CRM, Member scope and active assignment rows.
- The old assignment becomes `PAUSED`.
- The CRM scope changes to the new Coach.
- The new assignment must reference an active Program owned by the new Coach.
- Concurrent reassign has exactly one winner (`200`) and one loser (`409`).
- Booking is not used to create Coach–Member ownership.

## 13. Session Snapshot

Starting a Member Workout creates `MemberWorkoutSessionExercises` snapshots containing the exercise target at start time. Later Coach Program edits do not rewrite the historical session snapshot.

## 14. Set Logs

`MemberWorkoutSetLogs` stores set-level Member input with uniqueness protection on session exercise and set number. Active sessions support the existing Set Log contract; terminal sessions are read-only. Admin Set Log mutation is denied.

## 15. Progress

Progress is derived from completed Member sessions and completed Set Logs. Duration, training volume and completion rate are scoped to the Member's active assignment and Coach visibility rules. Reassignment preserves historical session/progress records.

## 16. Security, IDOR and concurrency

The isolated Admin acceptance verified:

- Guest/Coach/Member Admin denial.
- Coach A cannot read Member B.
- Suspended Coach token denial and reactivation behavior.
- Duplicate assignment conflict.
- Concurrent reassignment winner/loser behavior.
- Old Coach scope removal and new Coach scope creation.
- Session/progress preservation.
- Read-only Admin Governance and Set Log denial.

## 17. Build and TypeScript

Latest verification on `coach1`:

- Backend build: PASS.
- Backend lint: PASS with `0` errors and existing warnings.
- Frontend TypeScript: PASS with `0` errors.
- Frontend production build: PASS with the existing non-blocking large-chunk warning.

## 18. Acceptance

`backend/src/scripts/admin-coach-acceptance.ts` passed on isolated database `GYMFIT_DB_ADMIN_COACH_ACCEPTANCE_20260804_012600`. It covered RBAC, Admin Exercise CRUD/status, Coach Program/Day/Exercise, assign/duplicate, Member Start Session/Set/Complete, Governance reads, IDOR, Set Log denial, reassignment, concurrency, history preservation, scope transfer and suspended Coach denial. Cleanup and database drop were verified.

## 19. Browser verification

Visual browser verification is blocked, not passed. The required Browser runtime entry point is missing and the repository has no Playwright package. The fallback started backend/frontend locally and verified API health `200`, Guest Admin API `401`, and direct frontend route responses `200`. Loading/empty/error/retry, dialogs, keyboard focus, console and responsive layout remain visually unverified at `375x812`, `768x1024` and `1440x900`.

## 20. Known limitations

- Browser visual verification requires a working approved browser runtime.
- Full-project clean install remains blocked at Marketplace/Seller migration `0100`.
- Backend lint has existing warnings, but zero errors.
- Admin detail displays specialization/experience as unavailable because those fields are not in the current schema.

## 21. Out of scope

No Coach task adds or changes Marketplace, Seller, Video, Auth architecture, payment, refund, settlement, payroll, AI, chat, notification complexity, live coaching or Booking ownership coupling. Admin Program Builder remains blocked because the existing `WorkoutPrograms.owner_coach_id` model is Coach-owned and no complete Admin ownership model was invented.

## 22. Final verdict

`PARTIALLY_COMPLETE`.

The Coach module implementation, migrations `0007`–`0009`, builds, TypeScript, acceptance and cleanup are verified. `FULL_COACH_MODULE_COMPLETE` is not claimed because browser visual verification is not available in this environment.
