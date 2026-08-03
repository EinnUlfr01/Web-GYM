# COACH FINAL VERIFICATION — SAFE COMPLETION PROMPT

## State

Repository:

```text
https://github.com/EinnUlfr01/Web-GYM
```

Target branch:

```text
coach
```

Current implementation status:

```text
ADMIN_COACH_MANAGEMENT: IMPLEMENTED
COACH_CORE_FLOW: IMPLEMENTED
BACKEND_AUTHORIZATION: IMPLEMENTED
CONCURRENCY_PROTECTION: IMPLEMENTED
EXERCISE_LIBRARY: IMPLEMENTED
WORKOUT_GOVERNANCE: IMPLEMENTED_READ_ONLY

MIGRATION_0009_CANONICAL_DB: PENDING
BROWSER_E2E: NOT_VERIFIED
ADMIN_PROGRAM_BUILDER: INTENTIONALLY_BLOCKED

CURRENT_VERDICT:
COACH_FEATURE_COMPLETE_PENDING_FINAL_VERIFICATION
```

Existing implementation includes:

- Admin Coach list/detail/status management.
- Assign and reassign Member to Coach.
- Admin Exercise Library CRUD and activate/deactivate.
- Admin Workout Governance read-only.
- Backend authorization for Admin routes.
- Suspended/Inactive Coach blocking.
- Acceptance tests for IDOR, duplicate assign and concurrent reassign.
- Handover document:

```text
docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md
```

The goal of this task is not to add more Coach features.

The goal is to safely complete final verification and determine whether the Coach module can receive:

```text
FULL_COACH_MODULE_COMPLETE
```

Do not assume the current handover report is correct. Verify directly from repository code, database migration state, builds, tests and runtime behavior.

---

## Tailor

### Technology and repository constraints

Inspect the repository before changing anything.

Expected stack:

- Backend: Node.js, TypeScript, Express.
- Frontend: React, TypeScript.
- Database: SQL Server.
- Migration system already exists in the repository.
- Canonical database name may be:

```text
GYMFIT_DB
```

Use the actual repository configuration as source of truth.

Do not introduce:

- A new ORM.
- A new database.
- A second migration system.
- A second SQL initialization script.
- A new authentication architecture.
- A new ownership model.
- New Coach business features.
- Chat, AI, payroll, live coaching or notification systems.
- Booking-to-Coach assignment coupling.
- Admin Program Builder.

Admin Program Builder must remain blocked unless the existing schema already contains a complete, explicit and tested ownership model. Do not invent one in this task.

### Scope allowed

Only modify files needed to:

1. Verify and safely apply migration `0009`.
2. Fix migration-runner compatibility if `0009` is not detected.
3. Fix actual bugs found in existing Admin Coach implementation.
4. Complete browser/runtime verification.
5. Fix the three existing TypeScript errors if they are real and safely fixable.
6. Fix related build, runtime, route, RBAC, responsive or UX defects.
7. Update tests and documentation to match verified behavior.
8. Produce a final audit report.

Do not refactor unrelated marketplace, seller, order, settlement, product, video or authentication modules unless a direct Coach regression proves the change is necessary.

---

## Evaluate

### Step 1 — Repository and branch integrity

Before changing code:

```bash
git status
git branch --show-current
git log --oneline -15
git diff --check
```

Requirements:

- Confirm the current branch.
- Confirm whether the working tree is clean.
- Identify untracked or uncommitted files.
- Do not delete user prompt packages or unrelated untracked files.
- Do not overwrite existing work.
- Record the starting commit SHA.

If the current branch is not `coach`, do not silently work on another branch.

Create a dedicated working branch from the latest `coach` branch:

```text
fix/vinh-coach-final-verification
```

Do not commit or push automatically unless explicitly requested by the user.

### Step 2 — Audit the Coach implementation directly

Inspect at minimum:

```text
backend/src/modules/admin-coaches
backend/src/modules/admin-exercises
backend/src/modules/admin-workouts
backend/src/modules/coach-workspace
backend/src/scripts/admin-coach-acceptance.ts
frontend/src/pages/admin/coaches
frontend/src/pages/admin/exercises
frontend/src/pages/admin/workouts
frontend/src/services
frontend/src/App.tsx
frontend/src/components/layout/Sidebar.tsx
docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md
```

Also locate:

- Migration `0009_admin_coach_management.sql`.
- Migration runner.
- Migration history table.
- Authentication middleware.
- Token-version validation.
- Coach status validation.
- Access policy and frontend role guards.

Verify that:

- Guest receives `401`.
- Coach and Member receive `403` on Admin APIs.
- Frontend guard is not treated as security.
- Suspended and inactive Coaches are blocked by backend authentication.
- Status change increments `token_version`.
- Assign rejects an already assigned Member.
- Reassign is transactional.
- Reassign preserves historical sessions and progress.
- Old Coach loses access after reassignment.
- New Coach gains access.
- Only one active Coach scope remains.
- Admin Workout Governance cannot mutate Program, Session, Set Log or Progress.
- Admin Exercise CRUD respects the existing schema.

### Step 3 — Migration `0009` verification

Locate the canonical migration file and verify:

- Naming follows repository convention.
- Migration runner detects it.
- Checksum behavior is correct.
- SQL is idempotent only where the migration system expects it.
- It does not recreate unrelated tables.
- It does not delete existing Program, Assignment, Schedule, Session or Progress data.
- It safely adds:

```text
coach_status
coach_status_reason
coach_status_updated_at
```

Verify constraints and defaults against actual application behavior.

Do not directly apply migration to `GYMFIT_DB` first.

Create an isolated verification database using the existing accepted naming pattern:

```text
GYMFIT_DB_COACH_FINAL_<timestamp>
```

Run the complete migration chain against the isolated database.

Verify:

- All migrations apply in the correct order.
- Migration `0009` becomes applied.
- No checksum mismatch.
- No duplicate object errors.
- Existing migration history remains valid.
- Cleanup successfully drops the isolated database.

Only after isolated verification passes:

1. Inspect current canonical DB migration status.
2. Back up or provide an explicit safe backup instruction.
3. Apply only through the repository migration runner.
4. Verify `0009` is applied.
5. Verify application queries can read the new fields.
6. Do not insert fake fixtures into the canonical database.

If canonical DB access is unavailable, report:

```text
BLOCKED_CANONICAL_DB_MIGRATION_ACCESS
```

Do not claim it passed.

### Step 4 — Backend verification

Run repository-correct commands. Expected examples:

```bash
cd backend
npm install
npm run build
npm run lint
```

Run the Admin Coach acceptance script only against an isolated database.

The acceptance test must cover or verify:

- Guest Admin API denial.
- Coach Admin API denial.
- Member Admin API denial.
- Admin Coach list/detail.
- Status ACTIVE → SUSPENDED.
- Suspended Coach authentication denial.
- Status SUSPENDED → ACTIVE.
- Exercise create/update/deactivate/activate.
- Member assignment.
- Duplicate assignment conflict.
- Coach ownership/IDOR denial.
- Member workout session creation and completion.
- Admin read-only governance access.
- Admin mutation denial for Set Log and other Coach-owned runtime data.
- Reassignment.
- Preservation of old sessions/progress.
- Old Coach scope removal.
- New Coach scope creation.
- Concurrent reassign winner/loser behavior.
- Cleanup of isolated database.

Do not weaken tests to make them pass.

### Step 5 — TypeScript and frontend verification

Run:

```bash
cd frontend
npm install
npx tsc --noEmit --pretty false
npm run build
```

The final target is:

```text
TypeScript errors: 0
Frontend build: PASS
```

Investigate the three previously reported TypeScript errors.

Fix them only when:

- The fix is behavior-preserving.
- The fix does not introduce broad refactors.
- The fix does not hide errors using unsafe casts.
- The fix does not disable TypeScript or lint rules globally.

Do not use:

```text
@ts-ignore
@ts-nocheck
skipLibCheck as a workaround
any everywhere
```

Existing unavoidable warnings may remain only if they do not fail the build and are documented precisely.

### Step 6 — Browser/runtime acceptance

Use the available browser automation tool if functional.

If browser automation remains unavailable, do not stop immediately.

Perform the strongest available fallback:

- Run backend and frontend locally.
- Use HTTP/API scripts for authorization and data flow.
- Inspect rendered route components.
- Verify route definitions.
- Verify error/loading/empty-state code paths.
- Produce a precise manual browser checklist.

Browser viewport targets:

```text
375px
768px
1440px
```

Verify:

#### Admin Coach list

- Page loads.
- Search works.
- Status filter works.
- Pagination works.
- Loading state.
- Empty state.
- API error and retry state.
- Row navigation to detail.
- No horizontal overflow at 375px.

#### Admin Coach detail

- Coach summary renders.
- Member list renders.
- Suspend/activate/inactivate confirmation.
- Status reason handling.
- Assign Member.
- Duplicate assign error.
- Reassign Member.
- Concurrent conflict message.
- Keyboard accessibility.
- Focus behavior after dialogs.
- Refreshing direct URL works.

#### Admin Exercise Library

- Search/filter/pagination.
- Create.
- Edit.
- Activate/deactivate.
- Validation messages.
- Empty/error/retry states.

#### Admin Workout Governance

- Programs.
- Assignments.
- Schedules.
- Sessions.
- Progress.
- Read-only behavior.
- No mutation controls that bypass ownership.

#### Security

Test with:

- Admin.
- Active Coach.
- Suspended Coach.
- Inactive Coach.
- Member.
- Guest.

Verify direct URL access as well as menu visibility.

If browser automation cannot run due to environment tooling, report:

```text
BROWSER_AUTOMATION_BLOCKED
```

but still provide:

- Exact reason.
- Commands successfully run.
- API/runtime evidence.
- Manual test checklist.
- Remaining risk.

Do not falsely mark browser verification as PASS.

### Step 7 — Regression safety

Confirm no regression in:

- Coach Workspace.
- Member Workout Flow.
- Authentication.
- Marketplace.
- Seller.
- Product/catalog.
- Orders.
- Settlement.
- Video.

At minimum run existing relevant builds/tests.

Use `git diff --check`.

Review the final diff for:

- Secret exposure.
- Hardcoded credentials.
- API keys.
- Broken route imports.
- Unbounded queries.
- Missing pagination.
- Unsafe SQL concatenation.
- Missing transaction rollback.
- Missing authorization.
- IDOR.
- Race conditions.
- Destructive migration operations.

---

## Plan

Execute in this exact priority order.

### Phase 1 — Inspect

1. Confirm branch and starting commit.
2. Inspect repository structure.
3. Inspect Coach/Admin implementation.
4. Inspect migration runner and `0009`.
5. Produce a short internal findings list before editing.

### Phase 2 — Isolated migration proof

1. Create isolated database.
2. Run full migration chain.
3. Verify `0009`.
4. Run schema checks.
5. Drop isolated database.
6. Confirm cleanup.

### Phase 3 — Build and automated acceptance

1. Backend build.
2. Backend lint.
3. Frontend TypeScript.
4. Frontend build.
5. Admin Coach acceptance.
6. Fix only verified defects.
7. Re-run all failed checks.

### Phase 4 — Runtime/browser acceptance

1. Start backend/frontend.
2. Test Admin routes.
3. Test role denial.
4. Test status changes.
5. Test assign/reassign.
6. Test exercise CRUD.
7. Test read-only governance.
8. Test responsive behavior.
9. Record evidence and blockers.

### Phase 5 — Canonical DB

Proceed only after isolated migration passes.

1. Inspect canonical migration state.
2. Provide backup/safety checkpoint.
3. Apply migration through normal runner.
4. Verify schema and history.
5. Do not insert fixture data.

### Phase 6 — Final cleanup

1. Run all builds and tests again.
2. Run `git diff --check`.
3. Review changed files.
4. Update handover documentation.
5. Keep working tree changes visible.
6. Do not commit or push automatically.

---

## Required final report

Return a structured final report containing:

### Repository

```text
REPOSITORY:
SOURCE_BRANCH:
WORK_BRANCH:
START_COMMIT:
END_COMMIT:
WORKTREE_STATUS:
```

### Migration

```text
MIGRATION_0009_FILE:
ISOLATED_DB:
FULL_CHAIN_RESULT:
0009_RESULT:
CHECKSUM_MISMATCH:
CLEANUP_RESULT:
CANONICAL_DB_RESULT:
```

### Verification

```text
BACKEND_BUILD:
BACKEND_LINT:
FRONTEND_TYPESCRIPT:
FRONTEND_BUILD:
ADMIN_COACH_ACCEPTANCE:
BROWSER_AUTOMATION:
MANUAL_BROWSER_CHECKLIST:
GIT_DIFF_CHECK:
```

### Security and business rules

```text
ADMIN_RBAC:
SUSPENDED_COACH_BLOCK:
DUPLICATE_ASSIGN_PROTECTION:
CONCURRENT_REASSIGN_PROTECTION:
COACH_IDOR:
SESSION_PROGRESS_PRESERVATION:
ADMIN_WORKOUT_READ_ONLY:
```

### Changed files

List every modified file and explain why it changed.

### Remaining issues

Separate into:

```text
BLOCKING
NON_BLOCKING
OUT_OF_SCOPE
```

### Final verdict

Use exactly one:

```text
FULL_COACH_MODULE_COMPLETE
COACH_FEATURE_COMPLETE_PENDING_BROWSER_VERIFICATION
COACH_FEATURE_COMPLETE_PENDING_CANONICAL_MIGRATION
PARTIALLY_COMPLETE
BLOCKED
```

Only use:

```text
FULL_COACH_MODULE_COMPLETE
```

when all of these are true:

- Migration `0009` is safely applied and verified on canonical DB.
- Backend build passes.
- Frontend TypeScript has zero errors.
- Frontend build passes.
- Admin Coach acceptance passes.
- Browser/runtime verification passes.
- Role and ownership security passes.
- Isolated DB cleanup passes.
- No blocking regression remains.

Do not exaggerate results.

Do not report PASS for anything that was not executed.

Do not add new Coach features merely to improve the verdict.
