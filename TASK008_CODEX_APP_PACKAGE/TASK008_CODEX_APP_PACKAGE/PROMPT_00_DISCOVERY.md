# CODEX TASK-008 — PROMPT 00

## Discovery-first, evidence-first, no implementation

You are Codex operating as a senior full-stack engineer, database engineer, security reviewer, and repository archaeologist inside the GymFit repository.

This is the first of two runs.

Your job in this run is to understand the repository deeply and produce an evidence-backed Discovery Gate. Do not implement TASK-008 business functionality in this run. Do not create a migration in this run. Do not make speculative schema changes. Do not modify Marketplace logic. Do not stop after a superficial file list.

Work carefully, persistently, and autonomously. Quality and correctness are more important than speed. Read actual source and database metadata before making decisions.

---

# 1. State

Project:

```text
GymFit
Node.js + Express + TypeScript backend
React + TypeScript + Vite frontend
SQL Server database
JWT + live AuthSession + RBAC
```

Official TASK-008 scope:

```text
Exercise Library
Workout Programs
Program Builder
Coach–Member scope
Member Assignments
Workout Schedules
Workout Sessions
Session Snapshots
Set Logs
Member Progress
Coach Dashboard integration
Member Dashboard integration
TASK-008 routes and authorization
security, IDOR, concurrency and acceptance
```

Baseline:

```text
base branch: seller_role_add
base commit: 54015ae9638ec9f722e171c01a0ca69533ba907d
target branch: feat/task-008-coach-workout
```

Tasks B and C are not part of this run.

---

# 2. Source-of-truth precedence

When files conflict, use:

1. actual repository source;
2. actual SQL Server metadata and migration status;
3. official task file and `README_TASK008_PHASED_PLAN.md`;
4. current project status/checkpoint;
5. older implementation specification;
6. historical text.

Do not follow stale migration references blindly.

Known conflict:

- older TASK-008 docs mention migration `0006`;
- repository already contains `0006_auth_session_security.sql`;
- repository contains Marketplace migrations `0100` through `0111`;
- applied migrations must never be edited or renumbered;
- Coach migration allocation is expected in `0007–0049`, but the exact first free version must be verified against source and `dbo.SchemaMigrations`.

---

# 3. Hard safety constraints

Never run:

```text
git reset --hard
git clean
git checkout -- .
git restore .
git stash drop
DROP DATABASE GYMFIT_DB
destructive bootstrap/reset against canonical DB
```

Never:

- expose `.env`;
- print secrets or credential-bearing connection strings;
- commit secrets;
- mutate canonical DB for acceptance;
- edit applied migrations;
- modify Marketplace backend/database;
- use `git add .` or `git add -A`;
- push;
- fabricate a PASS.

If the repository is not in the expected isolated worktree, record the problem and stop with `DISCOVERY_GATE_BLOCKED_WORKTREE`.

---

# 4. Read first

Read in this order:

```text
README_TASK008_PHASED_PLAN.md
nhiệm vụ task8.md if present
README.md
PROJECT_STATUS.md
ROADMAP.md
docs/README.md
docs/TASK-008_DISCOVERY_CHECKLIST.md
docs/TASK-008_IMPLEMENTATION_SPEC.md
docs/ARCHITECTURE.md
docs/DATABASE_AND_MIGRATIONS.md
docs/API_AND_AUTHORIZATION.md
docs/AUTH_RBAC_SECURITY_MODEL.md
docs/DEVELOPER_WORKFLOW.md
docs/KNOWN_LIMITATIONS.md
logs/TASK-008_START_CHECKPOINT.md
```

Then inspect package scripts, TypeScript config, lint config, shared API client and auth store.

Do not rely on a summary without opening the underlying source.

---

# 5. Git preflight

Record:

```text
pwd
git rev-parse --show-toplevel
git status --short --branch
git rev-parse HEAD
git branch --show-current
git remote -v with credentials redacted
git worktree list --porcelain
git log --oneline --decorate -20
git diff --check
```

Confirm:

- branch is the TASK-008 branch;
- baseline lineage includes `54015ae9638ec9f722e171c01a0ca69533ba907d`;
- no unrelated Marketplace edits are mixed into this worktree;
- instruction files copied by the runner are the only expected untracked/changed files at the beginning.

Create/update:

```text
docs/task-008/TASK008_EXECUTION_STATE.md
```

Set current phase to `P1_DISCOVERY`.

---

# 6. Baseline validation

Run non-destructive checks:

```bash
cd backend
npm run build
npm run lint
npm run db:migrate:status

cd ../frontend
npm run build

cd ..
git diff --check
```

Do not “fix” unrelated baseline failures in this run.

Classify each failure as:

```text
PASS
PRE_EXISTING_FAILURE
ENVIRONMENT_BLOCKED
TASK008_RELEVANT_BLOCKER
```

Capture command, exit code, important error and whether it blocks Discovery.

If DB connection is unavailable, do not guess. Continue static discovery, mark all runtime DB claims as unverified, and make the final verdict blocked if DB metadata is necessary to select migration compatibility.

---

# 7. Database discovery

Use read-only SQL only.

Identify target DB first:

```sql
SELECT DB_NAME() AS database_name;
```

Refuse mutation.

Read `dbo.SchemaMigrations`:

```text
version
filename/name
checksum
applied_at
```

Compare against `db/migrations`.

Check:

- pending count;
- checksum mismatch;
- duplicate version;
- missing file for applied version;
- first free Coach version in `0007–0049`;
- how the runner handles a newly added `0007` when `0100–0111` are already applied.

Inspect `sys.tables`, `sys.columns`, `sys.indexes`, `sys.foreign_keys`, `sys.check_constraints`, `sys.default_constraints`, `sys.triggers` for every relevant object.

Search all tables/columns for:

```text
exercise
workout
program
session
progress
coach
member
assignment
schedule
set
measurement
media
```

At minimum inspect:

```text
Users
Exercises
Workouts
WorkoutExercises
WorkoutSessions
Bookings
CRMCustomers
CRMNotes
CRMTasks
SchemaMigrations
```

For each table record:

```text
exists in canonical DB?
row count
columns/types/nullability/default
PK
FK
indexes
unique/filtered indexes
checks
triggers
consumer source files
data compatibility risks
```

Do not include sensitive row data. Aggregate counts and safe schema metadata are enough.

---

# 8. Backend discovery

Inspect and trace every route from mount to SQL:

```text
backend/src/app.ts
backend/src/config/database.ts
backend/src/middleware/auth.ts
backend/src/middleware/validate.ts
backend/src/middleware/errorHandler.ts
backend/src/utils/response.ts
backend/src/types/**
backend/src/modules/exercises/**
backend/src/modules/videos/**
backend/src/modules/media/**
backend/src/modules/coaches/**
backend/src/modules/bookings/**
backend/src/modules/crm/**
backend/src/modules/users/**
backend/src/scripts/migrate.ts
backend/src/scripts/*acceptance*
```

For each module, record:

```text
route
auth middleware
role middleware
request validation
controller/service flow
SQL query
ownership rule
response envelope
error mapping
transaction usage
concurrency handling
consumer
```

Trace `Workouts` usage globally. Do not stop at the obvious module.

Search:

```bash
rg -n -i "Workouts|WorkoutExercises|WorkoutSessions|Exercises|assigned_coach_id|coach_id|member_id|workout|progress" backend/src db frontend/src docs
```

Determine whether `Workouts` currently represents:

```text
video content
workout template
program
legacy sample
multiple concepts mixed together
```

List every consumer and risk of changing it.

---

# 9. Frontend discovery

Inspect:

```text
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/api/**
frontend/src/stores/authStore*
frontend/src/hooks/**
frontend/src/services/exercises.ts
frontend/src/types/exercise.ts
frontend/src/pages/exercises/ExerciseLibraryPage.tsx
frontend/src/pages/exercises/ExerciseDetail.tsx
frontend/src/pages/exercises/WorkoutPrograms.tsx
frontend/src/pages/coaches/**
frontend/src/pages/members/**
frontend/src/pages/dashboard/**
frontend/src/components/MediaPlayer.tsx
frontend/src/components/layout/**
frontend/src/components/dashboard/**
```

Record:

- public vs protected route;
- role guard;
- data source;
- hard-coded API base;
- mock/sample data;
- DTO mismatch;
- loading/error/empty behavior;
- reusable component;
- design system;
- shared integration conflict risk.

Prove whether `WorkoutPrograms.tsx` is presentation-only/local state or backed by an API.

Identify all files likely to conflict later with Marketplace UI:

```text
App.tsx
accessPolicy.ts
Layout
Sidebar
shared navigation
global CSS
```

Recommend editing these only once in Phase P8.

---

# 10. Media discovery

Inspect:

```text
backend/src/modules/media/**
backend/src/modules/videos/**
backend/src/app.ts static mounts
frontend/src/components/MediaPlayer.tsx
existing URL validators
upload configuration
public/media, uploads, image paths
```

Decide:

- public relative path policy;
- HTTPS policy;
- forbidden schemes;
- whether data URLs are allowed anywhere;
- whether local absolute paths are rejected;
- whether Exercise media should reuse existing storage;
- whether thumbnail/video fields already exist and are enough;
- whether a new upload system is out of scope.

Do not download or generate media.

---

# 11. Coach–Member discovery

Compare:

```text
CRMCustomers.assigned_coach_id
Bookings coach/member pair
Users route scope
CRM authorization
any membership/plan relation
any hidden relation in DB
```

Answer with evidence:

1. Is CRM assignment authoritative enough for Workout authorization?
2. Does it support active/inactive state?
3. Does it preserve history?
4. Can one Member have multiple Coaches?
5. Is one active pair enforced?
6. What happens when Coach role becomes inactive?
7. Does Booking grant scope? It should not unless an explicit policy says so.
8. What source powers `/members` for Coach?
9. Are concealed 404 patterns already used?

Choose one candidate decision, but do not implement it.

---

# 12. Canonical model decision

For each area choose exactly one:

```text
REUSE
EXTEND
REPLACE
DEPRECATED
```

Areas:

```text
Exercises table
Exercises public API
Exercises admin mutation
Workouts table
WorkoutExercises table
WorkoutSessions table
videos module
WorkoutPrograms.tsx shell
WorkoutPrograms local/sample data
MediaPlayer
media backend
CRM Coach relation
Bookings relation
Users scoped list
progress persistence
manual measurements
```

Each row needs:

```text
source evidence
DB evidence
reason
migration impact
backfill
consumer impact
security impact
risk
```

Do not select REPLACE without a migration/backfill and compatibility plan.

Do not select EXTEND if current table semantics conflict with the new concept.

---

# 13. Migration-numbering decision

Produce a dedicated report.

It must include:

- all migration files sorted;
- all applied migration versions;
- pending versions;
- checksum status;
- reserved ranges;
- exact proposed TASK-008 migration filenames;
- why adding a lower number after `0111` is or is not safe with the actual runner;
- collision handling;
- rollback policy;
- no-edit policy.

Possible result:

```text
0007_task008_workout_foundation.sql
0008_task008_assignments_sessions.sql
0009_task008_progress_entries.sql only if needed
```

But do not force these names if evidence says otherwise.

---

# 14. API contract draft

Do not implement endpoints. Draft the route families and exact policy.

For each planned endpoint include:

```text
method
path
role
ownership
request schema
response DTO
pagination
sort allowlist
state prerequisite
transaction
expected status codes
audit
acceptance tests
```

Reuse existing route patterns and response envelopes.

Resolve naming consistency:

```text
/admin
/coach
/workouts
/progress
```

Avoid unnecessary endpoint duplication by role if one scoped service can safely support multiple routers.

---

# 15. Data/state/concurrency design

Draft:

## Program ownership

- Admin-owned template;
- Coach-owned template;
- clone policy;
- inactive policy.

## Assignment state

```text
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

## Schedule state

```text
SCHEDULED
IN_PROGRESS
COMPLETED
SKIPPED
CANCELLED
```

## Session state

```text
SCHEDULED
IN_PROGRESS
COMPLETED
ABANDONED
CANCELLED
```

## Snapshot

List exact fields.

## Set logs

List exact fields and validation.

## Unique invariants

At minimum evaluate:

```text
one active Coach–Member pair
one primary active Assignment per Member
one in-progress Session per Member
unique set number per Session Exercise
unique order per parent
idempotent schedule generation
```

For each specify:

```text
application check
database constraint/index
transaction/lock
conflict response
concurrency acceptance
```

---

# 16. Timezone/progress design

Decide timezone source:

```text
Assignment.schedule_timezone
User timezone if existing
fallback policy
```

Do not use server timezone implicitly.

Draft exact SQL/query semantics for:

```text
completed sessions
total duration
training volume
completion rate
weekly grouping
monthly grouping
exercise history
```

Define:

- due schedule;
- zero denominator;
- future exclusion;
- incomplete set exclusion;
- cancelled/abandoned exclusion;
- DST/date boundary behavior;
- precision and numeric type.

Decide whether manual body measurements are required. If not required by official scope, do not create `MemberProgressEntries` just because an old spec mentions it as optional.

---

# 17. File-change manifest

Create a planned manifest grouped by phase:

```text
new files
modified files
shared files deferred to P8
forbidden files
tests/scripts
docs
migrations
```

Do not make implementation changes.

---

# 18. Required outputs

Create directory:

```text
docs/task-008/
docs/task-008/adr/
```

Create:

```text
docs/task-008/TASK008_DISCOVERY_REPORT.md
docs/task-008/TASK008_DECISION_MATRIX.md
docs/task-008/TASK008_MIGRATION_NUMBERING_DECISION.md
docs/task-008/TASK008_API_CONTRACT_DRAFT.md
docs/task-008/TASK008_DATA_MODEL_DRAFT.md
docs/task-008/TASK008_SECURITY_TEST_MATRIX.md
docs/task-008/TASK008_IMPLEMENTATION_MANIFEST.md
docs/task-008/TASK008_EXECUTION_STATE.md
docs/task-008/TASK008_CHANGE_MANIFEST.md
```

You may add ADR drafts, but they remain `PROPOSED` until implementation prompt validates them.

Allowed edits in this run are limited to `docs/task-008/**` and one final log under `logs/`.

Do not edit root status docs yet.

---

# 19. Discovery Gate decision

PASS only if all are true:

- worktree safety verified;
- baseline captured;
- DB schema verified at runtime;
- migration status verified;
- no checksum mismatch;
- canonical model chosen with evidence;
- no parallel Workout system;
- Coach–Member scope chosen;
- media policy chosen;
- timezone chosen;
- migration numbering chosen;
- backfill strategy chosen;
- authorization boundaries explicit;
- concurrency invariants designed;
- file manifest complete;
- no Marketplace change required.

Write at the top and bottom of `TASK008_DISCOVERY_REPORT.md` exactly one:

```text
DISCOVERY_GATE_PASS
```

or:

```text
DISCOVERY_GATE_BLOCKED
```

If blocked, include exact blocker and safe next action. Do not create a fake PASS to allow the next script stage.

---

# 20. Final response format

Return a concise final message, but the files must be detailed.

Use this exact order:

```text
1. DISCOVERY VERDICT
2. WORKTREE/BASELINE
3. DATABASE/MIGRATION STATUS
4. CANONICAL MODEL DECISIONS
5. COACH–MEMBER DECISION
6. MEDIA/TIMEZONE DECISION
7. MIGRATION PLAN
8. IMPLEMENTATION PHASE MANIFEST
9. BLOCKERS
10. FILES CREATED
```

Do not implement TASK-008 in this run.
