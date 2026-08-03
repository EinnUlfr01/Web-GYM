# CODEX TASK-008 — PROMPT 01

## Long-horizon phased implementation with hard gates

You are Codex operating as an autonomous senior software engineer, SQL Server engineer, security engineer, test engineer, and frontend engineer inside the isolated GymFit TASK-008 worktree.

This is the implementation run. The Discovery run must already have produced `docs/task-008/TASK008_DISCOVERY_REPORT.md` containing `DISCOVERY_GATE_PASS`.

Do not ask for a new prompt after each phase. Continue autonomously from phase to phase only when the current gate passes. If a phase fails, diagnose, repair, rerun focused validation, and continue. Do not bypass a failed gate. Do not widen scope.

Optimize for correctness, data integrity, security, maintainability, and polished UX rather than speed. Work for as long as necessary within this run. Avoid repeated re-reading and random edits. Use the Discovery reports as durable context.

---

# 1. Mandatory first checks

Before editing code:

1. Read:
   ```text
   README_TASK008_PHASED_PLAN.md
   docs/task-008/TASK008_DISCOVERY_REPORT.md
   docs/task-008/TASK008_DECISION_MATRIX.md
   docs/task-008/TASK008_MIGRATION_NUMBERING_DECISION.md
   docs/task-008/TASK008_API_CONTRACT_DRAFT.md
   docs/task-008/TASK008_DATA_MODEL_DRAFT.md
   docs/task-008/TASK008_SECURITY_TEST_MATRIX.md
   docs/task-008/TASK008_IMPLEMENTATION_MANIFEST.md
   docs/task-008/TASK008_EXECUTION_STATE.md
   ```
2. Confirm `DISCOVERY_GATE_PASS`.
3. Confirm current branch is `feat/task-008-coach-workout` or the Discovery-approved equivalent.
4. Confirm lineage includes baseline commit `54015ae9638ec9f722e171c01a0ca69533ba907d`.
5. Confirm migration status has no checksum mismatch.
6. Confirm no unrelated dirty changes.
7. Confirm target database before any DB command.

If any fail, stop with `BLOCKED` and do not improvise.

---

# 2. Non-negotiable constraints

## 2.1 Scope

Implement only TASK-008 Coach/Workout/Progress.

Do not implement:

```text
Marketplace UI work
Marketplace backend work
project-wide handoff unrelated to TASK-008
AI recommendation
camera
pose estimation
automatic rep counting
nutrition
medical diagnosis
wearables
live video coaching
social/gamification expansion
new payment work
```

## 2.2 Forbidden Marketplace paths

Do not modify:

```text
backend/src/modules/marketplace-*/**
backend/src/modules/products/**
backend/src/modules/cart/**
backend/src/modules/orders/**
backend/src/modules/refunds/**
backend/src/modules/seller-*/**
backend/src/modules/shops/**
backend/src/modules/brand-requests/**
backend/src/modules/complaints/**
backend/src/modules/reviews/**
backend/src/modules/product-moderation/**
db/migrations/0100_*.sql
db/migrations/0101_*.sql
db/migrations/0102_*.sql
db/migrations/0103_*.sql
db/migrations/0104_*.sql
db/migrations/0105_*.sql
db/migrations/0106_*.sql
db/migrations/0107_*.sql
db/migrations/0108_*.sql
db/migrations/0109_*.sql
db/migrations/0110_*.sql
db/migrations/0111_*.sql
```

## 2.3 Git safety

Never run:

```text
git reset --hard
git clean
git restore .
git checkout -- .
git stash drop
git add .
git add -A
git push --force
```

Do not push automatically.

Commit only after each phase gate passes. Stage explicit paths.

## 2.4 Database safety

- Never mutate `GYMFIT_DB` with acceptance fixtures.
- Never drop canonical DB.
- Never edit applied migration.
- Never change migration checksum.
- Never silently skip incompatible schema.
- Never use destructive reset as migration strategy.
- Never store secret in docs/logs.
- Apply migration first on isolated acceptance clone.
- Canonical apply requires backup + verification evidence according to repository process.
- If canonical mutation cannot safely be performed in the current environment, implement and validate on isolated DB, mark canonical apply pending honestly.

## 2.5 Security

- Identity from JWT.
- Backend authorization mandatory.
- Owner/scope query must be server-side.
- Coach requires active scope.
- Member self only.
- Admin operational full scope.
- Conceal out-of-scope resources according to existing policy.
- Strict request schemas.
- Parameterized SQL.
- Sort allowlists.
- Transactions and constraints for races.
- Do not log personal metrics unnecessarily.

---

# 3. Execution state discipline

At the start and end of every phase update:

```text
docs/task-008/TASK008_EXECUTION_STATE.md
docs/task-008/TASK008_CHANGE_MANIFEST.md
```

Track:

```text
phase
status
input commit
allowed files
files changed
migration status
commands
tests
failures
repairs
gate verdict
output commit
next phase
```

Status values:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
PASS
```

Do not mark PASS before evidence exists.

If the same failure repeats twice, stop random patching. Re-open the contract and identify the root assumption that is wrong.

---

# 4. Phase P2 — Finalize ADR and migration contract

Discovery created drafts. Before implementation:

1. Validate each draft against actual source.
2. Promote ADR status from `PROPOSED` to `ACCEPTED`.
3. Ensure one canonical model only.
4. Resolve all migration compatibility details.
5. Finalize exact API paths and DTOs.
6. Finalize exact enum casing.
7. Finalize all unique/check/FK/index names.
8. Finalize rollback/backfill.
9. Finalize file manifest.
10. Verify no Marketplace object is touched.

Required ADR:

```text
ADR-001-workout-template-canonical-model.md
ADR-002-coach-member-scope.md
ADR-003-session-snapshot.md
ADR-004-timezone-and-progress.md
ADR-005-migration-numbering.md
ADR-006-media-policy.md
```

Gate:

```text
P2_ARCHITECTURE_GATE_PASS
```

Commit:

```text
chore(task008): establish architecture and migration contracts
```

---

# 5. Phase P3 — Exercise Library

## 5.1 Database

Implement only the Discovery-approved compatible extension.

Possible additions, only if missing:

```text
slug uniqueness
instructions
body part or canonical muscle field
equipment
difficulty constraint
media/thumbnail
estimated duration
created_by
is_active
updated_at
indexes
```

Do not create a second Exercise table.

Migration SQL requirements:

- explicit `dbo.`;
- object shape validation;
- deterministic backfill;
- fail fast with `THROW` on incompatible data;
- no data loss;
- no hard delete;
- constraint names deterministic;
- index names deterministic;
- transaction handled by runner;
- compatible with SQL Server;
- `GO` only on its own line.

## 5.2 Backend structure

Prefer a maintainable module split consistent with repository:

```text
exercises.routes.ts or index.ts
exercises.validation.ts
exercises.controller.ts
exercises.service.ts
exercises.types.ts if useful
```

Do not refactor unrelated modules.

Implement:

### Public

```text
GET list active
GET detail active
GET filters/taxonomy
```

### Admin

```text
GET list including inactive
GET detail
POST create
PATCH update
POST/PATCH deactivate/reactivate
```

Coach uses public/authorized active read according to ADR, not global mutation.

Validation:

- strict;
- no unknown fields;
- trim;
- safe lengths;
- enum allowlists;
- safe slug;
- finite numeric values;
- HTTPS or safe public-relative media path;
- reject file/javascript/data/Windows absolute/local unsafe schemes according to ADR;
- bounded pagination;
- sort allowlist.

Service:

- parameterized SQL;
- no mass assignment;
- no dynamic column from user without allowlist;
- consistent DTO;
- unique conflict → 409;
- missing → 404;
- role enforced at router and ownership where relevant.

## 5.3 Frontend

Refactor `frontend/src/services/exercises.ts` to use the shared API client. Do not hard-code host.

Keep public pages functional.

Create Admin UI according to route contract:

```text
list
create
edit
status action
```

Use:

- existing design primitives;
- loading;
- error;
- empty;
- retry;
- pagination;
- accessible form;
- inline errors;
- React confirmation dialog;
- responsive layout.

Do not use mock data.

## 5.4 Tests

Add focused acceptance coverage:

```text
public active list/detail
inactive hidden
Admin create/update/deactivate/reactivate
Coach mutation denied
Member mutation denied
unknown field denied
unsafe media denied
duplicate slug conflict
pagination/sort validation
SQL injection-shaped input harmless
```

Use isolated DB.

## 5.5 Gate

Run:

```bash
cd backend
npm run build
npm run lint
# task008 exercise acceptance command

cd ../frontend
npm run build

cd ..
git diff --check
```

Inspect diff for forbidden paths.

Gate verdict:

```text
P3_EXERCISE_LIBRARY_GATE_PASS
```

Commit explicit Exercise paths only:

```text
feat(task008): complete exercise library
```

---

# 6. Phase P4 — Workout Program and Program Builder

## 6.1 Remove production mock behavior

`WorkoutPrograms.tsx` currently contains sample/local state. Replace the production data path with real API persistence. A small UI skeleton may be reused, but sample records must not be presented as stored data.

## 6.2 Backend/data

Implement canonical Program model exactly as accepted by ADR.

Support:

```text
Program list/detail/create/update/status
Program Day create/update/delete/reorder
Program Exercise add/update/remove/reorder
Program clone if ADR allows
```

Rules:

- Admin full.
- Coach own only.
- Member no template mutation.
- inactive Exercise cannot be newly added;
- inactive Program cannot be newly assigned;
- no hard delete after historical reference;
- numeric bounds;
- at least reps or duration target;
- stable ordering;
- unique order within parent;
- ownership queries conceal cross-Coach resource.
- all multi-row operations transactional.

Avoid N+1 queries. Use deliberate query shape.

## 6.3 Reorder concurrency

Design reorder as a single transactional operation:

- validate complete set of child IDs;
- verify all children belong to parent;
- reject duplicate/missing IDs;
- lock parent/children;
- use temporary ordering if unique constraint requires;
- update;
- commit;
- return canonical order.

Do not issue many independent client PATCH calls for one reorder.

## 6.4 Frontend builder

Implement:

```text
Program list
Program metadata form
Day tabs/cards
Exercise picker
Exercise target editor
reorder controls
save state
validation
status action
```

Accessibility:

- buttons have names;
- keyboard reorder alternative;
- form labels;
- focus management;
- errors associated with fields;
- mobile layout.

Do not use `window.alert` or `window.confirm`.

## 6.5 Tests

- Admin CRUD.
- Coach own CRUD.
- Coach A cannot read/update Coach B private management resource.
- Member mutation denied.
- inactive Exercise rule.
- invalid target.
- reorder duplicate/missing IDs.
- concurrent reorder deterministic.
- status transition.
- no sample data.
- public Exercise regression.

## 6.6 Gate/commit

```text
P4_PROGRAM_BUILDER_GATE_PASS
```

Commit:

```text
feat(task008): complete workout program builder
```

---

# 7. Phase P5 — Coach–Member scope, Assignment and Schedule

Follow accepted ADR. Do not invent a second scope system if CRM was accepted. If a dedicated relation was accepted, integrate existing scoped user/CRM flows carefully.

## 7.1 Coach–Member

Implement:

```text
Admin assign/unassign/reactivate
Coach read own scoped Members
Member read own Coach relation if required
history preserved
```

Rules:

- active roles;
- active relation;
- one active pair according to ADR;
- date validity;
- actor recorded;
- no Booking-derived implicit scope;
- no client-supplied actor identity;
- out-of-scope concealed.

If `frontend/src/pages/members/MembersPage.tsx` uses `/users`, ensure the backend returns only Workout-authorized scope for Coach or create a dedicated scoped endpoint according to ADR. Do not expose all users.

## 7.2 Assignment

Implement transactional create/update/state actions.

Rules:

- Coach must have active scope;
- Program ownership/visibility valid;
- Program active;
- one primary ACTIVE Assignment per Member;
- Member cannot assign self;
- Assignment state transitions centralized;
- start/end and timezone validation;
- historical relation remains readable according to privacy ADR;
- duplicate race protected by index.

## 7.3 Schedule

Implement deterministic generation.

Requirements:

- idempotency;
- no duplicate schedule rows;
- timezone-aware date calculation;
- preserve existing completed/in-progress schedule;
- clear policy for Program edits;
- no regeneration of historical Session;
- bounded generation horizon;
- transaction.

## 7.4 Frontend

Coach:

```text
scoped Member list
Member detail summary
assign Program
Assignment state
schedule preview
schedule actions
```

Member:

```text
current Assignment
Program summary
upcoming schedule
```

Do not yet implement Session logging UI beyond navigation placeholders backed by truthful API state.

## 7.5 Tests

- Coach A scope only.
- Coach B concealed.
- inactive scope denied.
- Booking alone does not grant scope.
- duplicate active pair race.
- duplicate Assignment race.
- invalid date/timezone.
- inactive Program.
- schedule idempotency.
- timezone boundary.
- Member self read only.
- Admin override.
- Marketplace/Auth regression.

## 7.6 Gate/commit

```text
P5_ASSIGNMENT_SCHEDULE_GATE_PASS
```

Commit:

```text
feat(task008): add coach member assignments and schedules
```

---

# 8. Phase P6 — Workout Session and immutable snapshot

## 8.1 Existing `WorkoutSessions`

The repository already has a legacy `WorkoutSessions` shape in schema/source evidence. Follow ADR:

- EXTEND safely;
- or migrate/backfill to the canonical model;
- or replace with compatibility plan.

Never create a second table with equivalent meaning and leave both active.

## 8.2 State policy

Centralize transitions in one backend helper/service.

Allowed:

```text
SCHEDULED → IN_PROGRESS
IN_PROGRESS → COMPLETED
SCHEDULED → CANCELLED
IN_PROGRESS → ABANDONED
```

Reject all others with 409.

Terminal state immutable.

## 8.3 Start transaction

A start operation must atomically:

1. derive Member from JWT;
2. lock Schedule/Assignment;
3. verify ownership/state/date;
4. enforce one `IN_PROGRESS` Session;
5. create/transition Session;
6. create Session Exercise snapshots;
7. update Schedule if appropriate;
8. commit.

Use DB unique protection and locking.

Handle unique violation as deterministic 409.

## 8.4 Snapshot

Persist accepted snapshot fields. Historical response must use snapshot values.

Add tests:

1. create Session;
2. capture snapshot;
3. edit Program/Exercise;
4. read Session;
5. prove historical values unchanged.

## 8.5 Complete/abandon/cancel

Complete:

- owner;
- in progress;
- validate completion policy;
- calculate duration server-side or safely reconcile;
- update Session and Schedule in one transaction;
- cannot double complete.

Abandon:

- in progress only;
- terminal;
- schedule result according to ADR.

Cancel:

- scheduled only;
- authorized actor according to ADR.

## 8.6 Frontend

Member:

```text
/workouts
/workouts/program
/workouts/schedule
/workouts/sessions
/workouts/sessions/:sessionId
```

Flow:

```text
Today
→ Detail
→ Start
→ Session page
→ later Set logging
→ Complete/Abandon
→ History
```

At this phase Session page can render exercises and state, but Set mutation belongs to P7.

## 8.7 Tests

- valid transitions;
- invalid transitions;
- double complete;
- two concurrent starts;
- cross-Member;
- Coach mutation denied unless explicitly allowed;
- snapshot integrity;
- schedule/session consistency;
- terminal immutable;
- UTC timestamps.

## 8.8 Gate/commit

```text
P6_SESSION_SNAPSHOT_GATE_PASS
```

Commit:

```text
feat(task008): add workout sessions and immutable snapshots
```

---

# 9. Phase P7 — Set Logs

## 9.1 Backend/data

Implement canonical Set Log.

Validation:

```text
set_number integer > 0
reps integer >= 0 when provided
weight finite >= 0
duration integer >= 0
distance finite >= 0
note bounded
completed boolean
at least one meaningful metric according to target/policy
```

Rules:

- owning Member only;
- Session `IN_PROGRESS`;
- Session Exercise belongs to Session;
- unique `(session_exercise_id, set_number)`;
- no change after terminal;
- no moving log to another Session Exercise;
- concurrency protected by unique index and transaction;
- conflict → 409.

Update may use row version if accepted.

## 9.2 Frontend

Implement robust logging:

- one card per Session Exercise;
- target visible from snapshot;
- set rows;
- add/edit;
- loading per row;
- preserve input after error;
- validation before send;
- server error displayed;
- mobile number input;
- accessible controls;
- progress count;
- complete Session confirm.

Do not fabricate completed status.

## 9.3 Complete policy

Before complete, enforce accepted rule:

- all required sets complete;
- or confirmation of partial completion;
- or allow complete with explicit data.

Implement exactly ADR, backend authoritative.

## 9.4 Tests

- create/update;
- duplicate set race;
- negative/NaN/Infinity;
- cross-Member;
- terminal Session;
- wrong Session Exercise;
- double submit;
- completion interaction;
- snapshot target display.

## 9.5 Gate/commit

```text
P7_SET_LOG_GATE_PASS
```

Commit:

```text
feat(task008): add workout set logging
```

---

# 10. Phase P8 — Progress, dashboards, routes and shared integration

This is the only phase where broad shared route/menu files are edited.

## 10.1 Progress queries

Implement formulas from accepted ADR using SQL that is:

- scoped;
- parameterized;
- time-bounded;
- timezone-correct;
- indexed;
- precise;
- no N+1.

Metrics:

```text
completed sessions
total duration
training volume
completion rate
weekly/monthly buckets
exercise history
recent sessions
```

Use decimal types safely. Prevent JS number surprises where values can be large. Convert intentionally.

Zero denominator must return accepted value, never NaN/Infinity.

## 10.2 Manual measurements

Only implement if Discovery/ADR explicitly marked required.

If not required:

- do not create migration `0009`;
- omit measurement page or show it as not in scope;
- do not create a fake empty persistence layer.

If implemented:

- personal data;
- Member self input only unless ADR says otherwise;
- Coach read active scope;
- Admin operational;
- strict validation;
- no diagnosis;
- no public exposure.

## 10.3 Progress APIs

Member self:

```text
summary
sessions
exercise history
time series
optional measurements
```

Coach:

```text
scoped Member progress
```

Admin:

```text
operational progress lookup
```

Cross-scope concealed.

## 10.4 Dashboards

### Member Dashboard

Replace truthful unavailable states only when API exists.

Show:

```text
today workout
current program
upcoming schedule
recent session
completion rate
training volume
history shortcut
```

### Coach Dashboard

Show:

```text
scoped Member count
active assignments
upcoming workouts
recent completion
attention list based on real rule
```

No fabricated KPI.

### Admin

Integrate Exercise/Program operations without unrelated dashboard redesign.

## 10.5 Shared route integration

Now update, minimally:

```text
backend/src/app.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/**
```

Rules:

- add each router once;
- preserve route order;
- avoid path collision;
- preserve Marketplace routes;
- preserve Seller role behavior;
- add role guards;
- add navigation;
- no whole-file reformat;
- test Guest/Member/Coach/Admin/Seller reachability.

## 10.6 Frontend service architecture

- shared Axios client;
- auth token behavior existing;
- typed request/response;
- no hard-coded base URL;
- no business authorization in UI;
- query cancellation/race handling where necessary;
- consistent error mapping.

## 10.7 UI quality

Perform a deliberate frontend pass:

- visual hierarchy;
- consistent spacing;
- responsive;
- loading skeleton/spinner;
- empty/error/retry;
- focus;
- labels;
- aria;
- keyboard;
- status badge text;
- Vietnamese protected UX;
- no tiny unreadable text;
- no horizontal overflow;
- no inaccessible color-only state.

Do not redesign unrelated Marketplace pages.

## 10.8 Tests

- exact formulas using fixtures;
- future excluded;
- cancelled/abandoned excluded;
- incomplete Set excluded;
- timezone date boundary;
- Member A/B privacy;
- Coach A/B scope;
- inactive scope;
- Admin;
- dashboards render real data;
- route guards;
- Seller regression;
- public route regression;
- frontend build.

## 10.9 Gate/commit

```text
P8_PROGRESS_DASHBOARD_GATE_PASS
```

Commit:

```text
feat(task008): add scoped progress and dashboard integration
```

---

# 11. Phase P9 — Full acceptance and closure

## 11.1 Acceptance scripts

Create maintainable scripts following repository patterns, for example:

```text
backend/src/scripts/task-008-preflight.ts
backend/src/scripts/task-008-acceptance.ts
backend/src/scripts/task-008-concurrency-acceptance.ts
backend/src/scripts/task-008-integrity.ts
```

Add package scripts with explicit names.

Do not copy huge Seller scripts blindly. Reuse helpers where sensible.

Every acceptance script must refuse canonical DB and require an environment guard such as:

```text
TASK008_ACCEPTANCE=1
database prefix GYMFIT_DB_TASK008_ACCEPTANCE_
```

## 11.2 Isolated DB lifecycle

Implement or document safe lifecycle:

1. create/restore isolated DB;
2. verify name;
3. apply full migration chain;
4. seed deterministic actors;
5. execute;
6. collect evidence;
7. cleanup fixtures;
8. drop isolated DB;
9. verify absent;
10. verify canonical untouched.

No secret in output.

## 11.3 Full matrix

Actors:

```text
Guest
Member A
Member B
Coach A
Coach B
Admin
Seller regression
```

Functional:

```text
Exercise CRUD/read
Program builder
Coach scope
Assignment
Schedule
Session
Snapshot
Set
Progress
Dashboards
```

Security:

```text
authentication
role
ownership
IDOR
mass assignment
SQL injection-shaped inputs
unsafe sort
unsafe media
XSS-shaped text storage/render
sensitive DTO
```

Concurrency:

```text
active Coach–Member
active Assignment
schedule generation
Session start
Set number
double complete
reorder
row version if used
```

Integrity:

```text
no orphan
no duplicate invariant
snapshot immutable
terminal immutable
progress formula
timezone
migration checksum
canonical counts unchanged
```

Browser:

```text
Admin
Coach
Member
desktop
mobile
loading
empty
error
```

Use existing browser tooling if present. Do not add a large framework solely for one smoke test unless justified. If browser automation is unavailable, create a precise manual acceptance checklist and run what the environment supports; report honestly.

## 11.4 Regression

At minimum:

```text
auth login/refresh/session
public product/catalog reachability
seller/admin marketplace route reachability
public coaches
booking
public exercises
frontend build
backend build
migration status
```

Do not fix unrelated regressions by modifying Marketplace logic. If TASK-008 shared integration caused it, fix the shared integration.

## 11.5 Final review loop

Before final docs:

1. inspect full diff against baseline;
2. list forbidden-path changes;
3. if any, revert only those TASK-008 changes safely with targeted patch, not global restore;
4. run security review;
5. run full builds;
6. run `git diff --check`;
7. inspect untracked files;
8. remove acceptance artifacts;
9. scan secret patterns;
10. rerun migration status.

Do not endlessly refactor after tests pass. Only fix concrete correctness, security, performance, maintainability or UX issues.

## 11.6 Documentation

Update verified facts only:

```text
README.md
PROJECT_STATUS.md
ROADMAP.md
docs/README.md
docs/ARCHITECTURE.md
docs/DATABASE_AND_MIGRATIONS.md
docs/API_AND_AUTHORIZATION.md
docs/KNOWN_LIMITATIONS.md
logs/TASK-008_FINAL_HANDOFF.md
```

Correct stale `0006` references carefully. Preserve historical statements when labeled historical; update current-state claims.

Document:

```text
branch
base
commits
migration files
API
routes
security policy
tests run
results
acceptance DB
cleanup
canonical integrity
limitations
```

## 11.7 Final commit

Stage explicit paths only.

Suggested commits can remain phase-separated. Final docs commit:

```text
docs(task008): finalize implementation handoff
```

Do not push unless the user has explicitly authorized push. This prompt does not authorize push.

---

# 12. Build and quality commands

Use repository scripts first.

Backend:

```bash
npm run build
npm run lint
npm run db:migrate:status
```

Frontend currently has build but no typecheck script. `npm run build` invokes the configured Vite/TypeScript path as defined. Do not claim a separate typecheck passed unless you actually added and ran one.

Run:

```bash
git diff --check
git status --short
```

Use focused commands during phases and full commands at gates.

---

# 13. Error handling rules

When a command fails:

1. capture exact command and exit code;
2. identify whether baseline/environment/TASK-008;
3. inspect the smallest relevant source;
4. fix root cause;
5. rerun focused test;
6. rerun gate;
7. record repair.

Do not:

- suppress errors;
- weaken validation;
- remove constraints;
- skip test;
- catch and return success;
- add arbitrary delays for races;
- use retry loop to hide concurrency bug;
- change unrelated package versions.

---

# 14. Performance requirements

- bounded pagination;
- indexes match common role/date/status queries;
- no N+1;
- batch query Program tree efficiently;
- transaction scopes short;
- locks in consistent order;
- progress queries time-bounded;
- avoid loading all Sessions for summary;
- frontend avoids duplicate fetch;
- no expensive global rerender from every Set keystroke;
- debounce search appropriately;
- no premature complex caching.

Measure or reason from query plans where DB access supports it. Do not claim performance without evidence.

---

# 15. Security requirements in detail

## Authentication

Use existing `authenticate` middleware and live session validation.

## Authorization

Use existing role enum and middleware, plus owner/scope service filters.

## IDOR

Prefer:

```sql
SELECT ...
FROM resource
WHERE id=@id
  AND owner/scope predicate
```

Then 404 if absent.

Do not:

```text
SELECT by id
then compare owner
then return 403 with existence disclosure
```

unless existing explicit policy requires 403.

## Mass assignment

Never spread request body into SQL or model update.

## SQL injection

Every value parameterized. Dynamic sort/column only from hard-coded map.

## XSS

Store text as text. Render React text, not unsafe HTML. Do not use `dangerouslySetInnerHTML` for instructions/notes without a reviewed sanitizer.

## Media

Enforce ADR server-side. Frontend filtering is not sufficient.

## Privacy

Progress and workout history are personal. Avoid logs and public DTOs.

## Concurrency

Use constraints and transaction, not in-memory mutex.

---

# 16. Final report

Create:

```text
logs/TASK-008_FINAL_HANDOFF.md
```

Use exact order:

```text
1. PREFLIGHT
2. SAFETY SNAPSHOT
3. WORKTREE / BRANCH / BASELINE
4. BASELINE BUILD
5. DISCOVERY GATE
6. DECISION MATRIX
7. ADR
8. MIGRATION NUMBERING
9. MIGRATION FOUNDATION
10. EXERCISE LIBRARY
11. WORKOUT PROGRAMS
12. PROGRAM BUILDER
13. COACH–MEMBER
14. ASSIGNMENT
15. SCHEDULE
16. SESSION
17. SNAPSHOT
18. SET LOGS
19. PROGRESS
20. MEMBER DASHBOARD
21. COACH DASHBOARD
22. ROUTE/MENU
23. AUTHORIZATION
24. IDOR
25. CONCURRENCY
26. TIMEZONE
27. MEDIA
28. ADMIN BROWSER
29. COACH BROWSER
30. MEMBER BROWSER
31. REGRESSION
32. MIGRATION STATUS
33. ACCEPTANCE CLEANUP
34. CANONICAL INTEGRITY
35. FINAL BUILD
36. SECURITY REVIEW
37. FILES CHANGED
38. COMMITS
39. PUSH STATUS
40. REMAINING ISSUES
41. FINAL VERDICT
```

Final verdict only:

```text
FULL_TASK_008_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

Do not use `FULL_TASK_008_COMPLETE` if any mandatory gate or test was not run/passed.

---

# 17. Autonomy instruction

Continue through all phases in this run without asking the user to re-prompt after each phase.

You are authorized to:

- read repository files;
- create/edit TASK-008 in-scope local files;
- create migrations in the Discovery-approved Coach range;
- run non-destructive builds/lint/tests;
- create and use isolated acceptance resources;
- make phase commits locally after gates pass;
- update TASK-008 docs.

You are not authorized to:

- push;
- delete/reset unrelated work;
- mutate/drop canonical DB destructively;
- change secrets;
- change Marketplace backend/database;
- expand scope.

Persist until the implementation is complete or a genuine hard blocker is reached.
