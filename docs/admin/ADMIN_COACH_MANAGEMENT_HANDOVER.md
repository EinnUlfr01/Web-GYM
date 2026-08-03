# Admin Coach Management Handover

Status: IMPLEMENTED, BACKEND VERIFIED; BROWSER VERIFICATION BLOCKED BY ENVIRONMENT
Branch: `feat/vinh-admin-coach-management`
Start commit: `90140f5`
End commit: no commit created; working tree intentionally left uncommitted.

## Scope and verdict

This branch adds the bounded Admin layer for TASK-008: dedicated Coach list/detail pages, Coach status management, CRM Member assign/reassign, Admin Exercise Library, read-only Workout Governance, backend authorization, frontend routes and an isolated acceptance script. Coach Workspace and Member Workout Flow are reused, not rewritten. Final verdict is `PARTIALLY_COMPLETE` because the isolated backend acceptance passed but browser acceptance could not start: the available Browser plugin is missing its required `scripts/browser-client.mjs`.

Admin Program Builder is `BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL`: `WorkoutPrograms` currently has `owner_coach_id` only, so Admin stays read-only for Program governance.

## Routes and authorization

Frontend routes:

- `/admin/coaches`
- `/admin/coaches/:coachId`
- `/admin/exercises`
- `/admin/workouts`

Backend Admin APIs require `authenticate` and `authorize(UserRole.ADMIN)`. Guest requests receive `401`; Coach/Member requests receive `403`. Frontend guards are navigation UX only.

Coach APIs are unchanged except for the live authentication check: `SUSPENDED` and `INACTIVE` Coaches cannot access Coach Workspace. Admin status changes increment `token_version`.

## APIs

- `GET /api/admin/coaches`, `/summary`, `/:coachId`, `/:coachId/members`, `/coach-members/unassigned`
- `PATCH /api/admin/coaches/:coachId/status`
- `POST /api/admin/coaches/:coachId/members/:memberId/assign`
- `POST /api/admin/coaches/:coachId/members/:memberId/reassign`
- `GET/POST /api/admin/exercises`, `GET/PATCH /api/admin/exercises/:exerciseId`, `POST .../activate`, `POST .../deactivate`
- `GET /api/admin/workouts/programs|assignments|schedules|sessions|progress`

Exercise fields are limited to the existing `Exercises` schema. Workout Governance is GET-only; there is no Admin Session, Snapshot, Set Log or generic Assignment PATCH endpoint.

## Status and assignment rules

Migration `0009_admin_coach_management.sql` adds `coach_status`, bounded `coach_status_reason` and `coach_status_updated_at`. `ACTIVE` uses `is_active=1`; `INACTIVE` uses `is_active=0`; `SUSPENDED` remains visible to Admin but is rejected by live Coach authentication. No historical Program, Assignment, Session or Progress rows are deleted.

Assign locks the active Member and CRM row, verifies an active Coach and rejects an existing Coach scope with `409`. Reassign calls the existing transactional `reassignMemberCoach` service, locks Member/scope/assignment, pauses the old active Assignment, preserves sessions, creates the new Coach-owned active Assignment and commits one active scope. `Booking` is not used to create the Coach–Member relation.

## Acceptance matrix

`backend/src/scripts/admin-coach-acceptance.ts` covers Guest/Coach/Member denial, Admin Exercise create, Coach Program/Assignment/Schedule, Member Session/Set/Complete, Admin governance read, scoped Coach Progress, Coach A IDOR denial for Member B, Admin Set Log denial, duplicate assign, concurrent reassign winner/loser behavior, reassignment preservation/scope change and suspended Coach denial. Run only against `GYMFIT_DB_ADMIN_COACH_ACCEPTANCE_<timestamp>` with `ADMIN_COACH_ACCEPTANCE=1`; run `--cleanup` and verify the database is dropped/absent afterward. Latest isolated run: `PASS`.

Browser checks remain required at 375px, 768px and 1440px for loading, empty/error/retry states, keyboard/focus, confirmation dialogs and no new console errors. They are blocked in this environment because the Browser skill's required `scripts/browser-client.mjs` is absent; no browser PASS is claimed.

## Verification and known limitations

- Backend build: `PASS` (`cd backend; npm run build`).
- Frontend typecheck: run `cd frontend; npx tsc --noEmit --pretty false`; only the three pre-existing out-of-scope errors are allowed.
- Frontend build: `PASS` (`cd frontend; npm run build`; existing large-chunk warning only).
- Migration: apply/check `0009` only through the normal runner after isolated-database/backup review.
- `git diff --check`: `PASS`. Admin-only lint: `PASS` with two existing-style `any` warnings in the acceptance script. Full backend lint still reports the pre-existing unused `page` error in `coach-workspace.controller.ts`.
- Existing schema has no specialization/experience columns; Admin displays those values as unavailable.
- No Marketplace, Video, Auth architecture, payroll, AI, chat, notification system, live coaching or Booking relation expansion is included.

## Files and final report

Implementation is under `backend/src/modules/admin-coaches`, `admin-exercises`, `admin-workouts`, `backend/src/scripts/admin-coach-acceptance.ts`, `frontend/src/pages/admin/coaches`, `admin/exercises`, `admin/workouts`, typed Admin services, `App.tsx`, `Sidebar.tsx` and migration `0009`. The final report must capture exact end commit, migration status, acceptance/browser/build results, the three pre-existing TypeScript errors, cleanup, canonical DB integrity, unchanged out-of-scope files and the final `FULL_COACH_MODULE_COMPLETE`, `PARTIALLY_COMPLETE` or `BLOCKED` verdict.
