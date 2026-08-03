# GYMFIT — TASK-008 COACH / WORKOUT PROGRAM / MEMBER PROGRESS

## Kế hoạch triển khai theo phase, chống xung đột và chống lặp

> **Phạm vi duy nhất của tài liệu này:** Nhóm nhiệm vụ **A. Coach / TASK-008**.  
> **Chưa thực hiện:** Nhóm B — Marketplace Frontend và nhóm C — hoàn thiện/bàn giao toàn dự án.  
> **Baseline chính thức:** branch `seller_role_add`, commit `54015ae9638ec9f722e171c01a0ca69533ba907d`.  
> **Nguyên tắc ưu tiên:** đúng dữ liệu, đúng quyền, đúng lịch sử và dễ kiểm thử quan trọng hơn tốc độ.

---

# 1. Mục tiêu

TASK-008 phải hoàn thiện toàn bộ luồng:

```text
Exercise Library
→ Workout Program
→ Program Day
→ Program Exercise
→ Coach–Member Scope
→ Member Assignment
→ Workout Schedule
→ Workout Session
→ Session Snapshot
→ Set Logs
→ Member Progress
→ Coach Dashboard / Member Dashboard
→ Authorization / IDOR / Concurrency / Acceptance
```

Kết quả cuối phải là một hệ thống liền mạch, không tạo hệ thống Workout thứ hai chạy song song với dữ liệu cũ, không phá Auth/RBAC, không chạm logic Marketplace của Nguyên và không làm mất dữ liệu lịch sử.

---

# 2. Nguồn sự thật và thứ tự ưu tiên

Khi tài liệu mâu thuẫn, dùng thứ tự sau:

1. **Source code và schema/migration đang tồn tại trong repository.**
2. **Trạng thái thực tế từ `npm run db:migrate:status` và metadata của SQL Server.**
3. **File nhiệm vụ chính thức `nhiệm vụ task8.md`.**
4. `PROJECT_STATUS.md`, `ROADMAP.md`, `logs/TASK-008_START_CHECKPOINT.md`.
5. `docs/TASK-008_IMPLEMENTATION_SPEC.md`.
6. Các tài liệu cũ hoặc câu mô tả lịch sử.

Không được dùng một câu trong tài liệu cũ để ghi đè lên source hoặc migration đã áp dụng.

## 2.1 Xung đột migration đã xác định

Một số tài liệu TASK-008 cũ ghi migration đầu tiên là `0006`. Điều này **không còn đúng** vì repository hiện có:

```text
0006_auth_session_security.sql
0100_seller_application_role_foundation.sql
...
0111_product_shop_reviews.sql
```

Quy tắc khóa:

- Tuyệt đối không sửa hoặc đổi tên `0001–0006`.
- Tuyệt đối không sửa hoặc đổi tên `0100–0111`.
- Vùng số Coach được tài liệu database phân bổ là `0007–0049`.
- Migration TASK-008 dự kiến bắt đầu từ `0007`, nhưng chỉ được chốt sau Discovery Gate.
- Trước khi tạo file, phải kiểm tra:
  - tên file trong `db/migrations`;
  - version trong `dbo.SchemaMigrations`;
  - checksum mismatch;
  - migration pending;
  - khả năng chạy runner khi một migration số nhỏ hơn `0100` được bổ sung sau Marketplace.
- Nếu `0007` đã tồn tại hoặc đã được áp dụng ở môi trường đích, chọn version trống tiếp theo trong `0007–0049`, ghi ADR và không tự renumber migration cũ.

---

# 3. Phát hiện ban đầu từ source hiện tại

Các phát hiện này chỉ là đầu vào cho Discovery, chưa phải quyết định schema cuối cùng.

## 3.1 Exercise đã tồn tại

Source hiện có:

```text
backend/src/modules/exercises/exercises.service.ts
backend/src/modules/exercises/exercises.controller.ts
backend/src/modules/exercises/index.ts
frontend/src/pages/exercises/ExerciseLibraryPage.tsx
frontend/src/pages/exercises/ExerciseDetail.tsx
frontend/src/services/exercises.ts
frontend/src/types/exercise.ts
db/schema.sql → Exercises
```

Hiện trạng đáng chú ý:

- Public list/detail đã có.
- Admin update đã có.
- Chưa có CRUD quản trị hoàn chỉnh.
- Validation còn mỏng.
- Service frontend đang hard-code `http://localhost:5000/api`, phải được thay bằng Axios/API pattern chung nếu Discovery xác nhận.
- Field naming giữa frontend và backend chưa hoàn toàn đồng nhất.
- Candidate classification: **EXTEND**, nhưng Discovery phải xác minh database thật.

## 3.2 Workout legacy đã tồn tại

`db/schema.sql` có:

```text
Workouts
WorkoutExercises
WorkoutSessions
```

Backend hiện sử dụng `Workouts` trong:

```text
backend/src/modules/videos/videos.controller.ts
backend/src/modules/coaches/coach.controller.ts
```

Điều này tạo rủi ro lớn:

- Không được tạo thêm một mô hình Workout mới mà bỏ mặc bảng cũ.
- Phải xác định `Workouts` đang là video catalog, workout template hay cả hai.
- Phải xác định dữ liệu thực tế và consumer trước khi chọn:
  - REUSE;
  - EXTEND;
  - REPLACE có backfill;
  - DEPRECATED có compatibility layer.

## 3.3 `WorkoutPrograms.tsx` hiện là UI trình diễn

Source hiện có `samplePrograms` và state local. Chưa thấy API persistence cho Program.

Candidate classification:

```text
UI shell: REUSE/EXTEND
Data model local/sample: REPLACE
```

Không được giữ sample program như dữ liệu thật sau TASK-008.

## 3.4 Coach–Member có nhiều tín hiệu nhưng chưa có relation chuẩn

Source hiện có:

```text
CRMCustomers.assigned_coach_id
Bookings.coach_id + member_id
backend/src/modules/users/users.routes.ts
backend/src/modules/crm/**
backend/src/modules/bookings/**
```

Phân biệt:

- Booking chỉ là một cuộc hẹn, không tự động chứng minh Coach đang được quyền quản lý Member.
- `CRMCustomers.assigned_coach_id` có thể là scope hiện có, nhưng phải kiểm tra:
  - có trạng thái active/inactive không;
  - có ngày bắt đầu/kết thúc không;
  - có unique constraint không;
  - có lịch sử không;
  - có phù hợp cho authorization của Workout hay không.

Không được suy luận quyền Coach chỉ vì từng có Booking với Member.

## 3.5 Worktree hiện tại có thể không sạch

Gói source được rà soát đang ở branch `feat/marketplace-ui-polish-v2`, HEAD cùng commit baseline nhưng worktree có nhiều thay đổi. Vì vậy TASK-008 không được chạy trực tiếp bằng reset/clean/check-out cưỡng bức.

Giải pháp bắt buộc:

```text
Giữ nguyên workspace hiện tại
→ tạo safety snapshot
→ tạo Git worktree riêng từ commit baseline
→ triển khai TASK-008 trong worktree riêng
```

---

# 4. Nguyên tắc kiến trúc bắt buộc

## 4.1 Không tạo hệ thống song song

Trước khi tạo table/module mới, phải trả lời:

1. Table tương đương đã tồn tại chưa?
2. API tương đương đã tồn tại chưa?
3. Consumer nào đang dùng nó?
4. Có thể mở rộng mà không phá contract không?
5. Nếu thay thế, chiến lược backfill và compatibility là gì?
6. Khi hoàn tất, có còn hai nguồn dữ liệu cùng biểu diễn một khái niệm không?

Nếu câu 6 là “có”, thiết kế chưa đạt.

## 4.2 Backend là lớp bảo mật chính

Frontend guard chỉ phục vụ UX. Mọi endpoint phải tự xác minh:

```text
authenticated identity
role
resource ownership
active Coach–Member scope
entity state
allowed transition
concurrency invariant
```

Không nhận `memberId`, `coachId`, `ownerId` từ body để thay thế identity từ JWT khi identity có thể suy ra từ token.

## 4.3 Lịch sử không phụ thuộc template mutable

Session phải lưu snapshot của bài tập tại thời điểm Session được tạo. Sau đó sửa Program không được làm thay đổi:

```text
exercise name lịch sử
thứ tự bài tập
target sets/reps/weight/duration
rest time
coach note hiển thị cho Member
```

## 4.4 Không hard delete dữ liệu đã được tham chiếu

Dùng:

```text
is_active
status
deactivated_at nếu cần
```

Hard delete chỉ được phép cho child chưa có lịch sử và khi FK/acceptance chứng minh an toàn.

## 4.5 SQL Server là nguồn dữ liệu duy nhất

- Dùng parameterized SQL.
- Dùng transaction cho state transition nhiều bước.
- Dùng `UPDLOCK`, `HOLDLOCK` hoặc isolation phù hợp cho race condition.
- Dùng unique/filtered indexes để database bảo vệ invariant.
- Không chỉ kiểm tra bằng `SELECT` rồi `INSERT` mà thiếu constraint.
- Không tạo aggregate table nếu query đủ nhanh và chính xác.
- Store timestamp theo UTC; timezone dùng IANA string ở Assignment/User level.

## 4.6 Không tác động Marketplace

Cấm sửa:

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
db/migrations/0100_*.sql đến 0111_*.sql
```

Nếu một shared file cần thay đổi:

```text
backend/src/app.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/**
```

chỉ sửa trong phase integration, thay đổi tối thiểu, ghi rõ từng dòng contract bị ảnh hưởng.

---

# 5. Mô hình thực thi chống vòng lặp

## 5.1 Một chiều theo dependency

```text
P0 Safety
  ↓
P1 Discovery
  ↓
P2 Architecture + Migration Contract
  ↓
P3 Exercise Library
  ↓
P4 Workout Program Builder
  ↓
P5 Coach–Member + Assignment + Schedule
  ↓
P6 Session + Snapshot
  ↓
P7 Set Logs
  ↓
P8 Progress + Dashboard + Routes
  ↓
P9 Full Acceptance + Closure
```

Không được nhảy sang phase sau khi gate trước chưa PASS.

## 5.2 Mỗi phase có phạm vi file rõ ràng

Mỗi phase phải ghi vào:

```text
docs/task-008/TASK008_EXECUTION_STATE.md
docs/task-008/TASK008_CHANGE_MANIFEST.md
```

Các field tối thiểu:

```text
phase
status
started_at
completed_at
input_commit
output_commit
files_allowed
files_changed
commands_run
tests_passed
tests_failed
known_risks
next_phase
```

## 5.3 Hạn chế retry mù

Với cùng một lỗi:

- Lần 1: đọc stack trace và sửa nguyên nhân gần nhất.
- Lần 2: kiểm tra assumption, contract và dữ liệu.
- Nếu vẫn lỗi: dừng sửa lặp, lập root-cause note.
- Không thay đổi ngẫu nhiên nhiều file để “thử”.
- Không xóa test hoặc giảm validation để làm test xanh.

## 5.4 Build hợp lý

Không full-build sau từng file.

Dùng:

```text
focused validation trong lúc code
→ phase-specific checks
→ full backend/frontend build tại gate
→ final build một lần sau full acceptance fixes
```

## 5.5 Commit checkpoint

Mỗi gate PASS tạo một commit có phạm vi duy nhất:

```text
chore(task008): establish discovery decisions
feat(task008): complete exercise library
feat(task008): complete workout program builder
feat(task008): add coach member assignments and schedules
feat(task008): add workout sessions and snapshots
feat(task008): add workout set logging
feat(task008): add scoped progress dashboards
test(task008): complete security and acceptance
docs(task008): finalize handoff
```

Không dùng `git add .` hoặc `git add -A`. Chỉ stage đường dẫn đã kiểm tra.

Không push tự động trước P9.

---

# 6. PHASE 0 — Safety, baseline và worktree riêng

## 6.1 Mục tiêu

Bảo vệ toàn bộ code hiện có trước khi TASK-008 sửa bất kỳ file nào.

## 6.2 Công việc

1. Xác nhận repository root.
2. Ghi:
   - current branch;
   - HEAD;
   - remote;
   - status;
   - worktree list.
3. Tạo safety directory ngoài Git worktree:
   ```text
   <repo-parent>/.task008-safety/<timestamp>/
   ```
4. Lưu:
   ```text
   git-status.txt
   git-diff.patch
   git-diff-staged.patch
   untracked-files.txt
   head.txt
   branches.txt
   worktrees.txt
   ```
5. Không reset, clean, stash drop hoặc checkout đè.
6. Tạo worktree:
   ```text
   branch: feat/task-008-coach-workout
   base: 54015ae9638ec9f722e171c01a0ca69533ba907d
   ```
7. Xác minh worktree mới sạch.
8. Cài dependency chỉ khi cần và không thay lockfile nếu install không đổi dependency.
9. Chạy baseline:
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

## 6.3 Không được làm

- Không sửa code.
- Không tạo migration.
- Không sửa `.env`.
- Không commit secret.
- Không apply migration.
- Không chạy acceptance mutation trên `GYMFIT_DB`.

## 6.4 Gate P0

PASS khi:

- worktree TASK-008 riêng tồn tại;
- HEAD đúng baseline hoặc có ADR giải thích baseline mới hơn;
- worktree sạch trước khi copy instruction files;
- baseline build/status đã được ghi;
- mọi lỗi baseline được phân loại `PRE_EXISTING`, không được che giấu.

Verdict:

```text
P0_SAFETY_GATE_PASS
```

---

# 7. PHASE 1 — Discovery Gate chỉ đọc và lập bằng chứng

## 7.1 Mục tiêu

Hiểu toàn bộ hệ thống liên quan trước khi thiết kế migration hoặc API.

## 7.2 Phạm vi audit

### Database

Kiểm tra metadata thật cho:

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

Tìm mọi table có tên hoặc column liên quan:

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

Thu thập:

- columns;
- types;
- nullable/default;
- PK/FK;
- indexes;
- unique/filtered indexes;
- checks;
- triggers;
- row count;
- sample shape đã ẩn dữ liệu nhạy cảm;
- consumers trong source.

### Backend

Audit:

```text
backend/src/app.ts
backend/src/config/database.ts
backend/src/middleware/auth.ts
backend/src/middleware/validate.ts
backend/src/middleware/errorHandler.ts
backend/src/modules/exercises/**
backend/src/modules/videos/**
backend/src/modules/media/**
backend/src/modules/coaches/**
backend/src/modules/bookings/**
backend/src/modules/crm/**
backend/src/modules/users/**
backend/src/scripts/migrate.ts
```

### Frontend

Audit:

```text
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/api/**
frontend/src/services/exercises.ts
frontend/src/types/exercise.ts
frontend/src/pages/exercises/**
frontend/src/pages/coaches/**
frontend/src/pages/members/**
frontend/src/pages/dashboard/**
frontend/src/components/MediaPlayer.tsx
frontend/src/components/layout/**
frontend/src/components/dashboard/**
frontend/src/stores/**
```

### Documentation

Đọc:

```text
nhiệm vụ task8.md nếu có
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

## 7.3 Quyết định bắt buộc

Lập bảng cho từng area:

| Area | REUSE | EXTEND | REPLACE | DEPRECATED | Evidence | Migration impact | Consumer impact |
|---|---:|---:|---:|---:|---|---|---|
| Exercises table/API | | | | | | | |
| Workouts table/API | | | | | | | |
| WorkoutExercises | | | | | | | |
| WorkoutSessions | | | | | | | |
| WorkoutPrograms.tsx | | | | | | | |
| MediaPlayer/media | | | | | | | |
| CRM Coach scope | | | | | | | |
| Bookings relation | | | | | | | |
| Progress storage | | | | | | | |

## 7.4 Các câu hỏi phải khóa

1. `Workouts` có phải Program template canonical không?
2. Nếu không, consumer `videos` và `coaches` sẽ chuyển như thế nào?
3. Có backfill dữ liệu cũ không?
4. `WorkoutSessions.user_id/workout_id` có thể mở rộng an toàn không?
5. Dùng `CRMCustomers.assigned_coach_id` hay bảng quan hệ riêng?
6. Khi Coach bị unassign, lịch sử có còn xem được không?
7. Ai sở hữu Program do Admin tạo?
8. Coach có được clone template Admin không?
9. Timezone lấy từ đâu?
10. Media URL nào được chấp nhận?
11. Exercise inactive hiển thị thế nào trong lịch sử?
12. Version migration chính xác là gì?
13. Có cần `MemberProgressEntries` không?
14. API response envelope phải theo pattern nào?
15. Concealed `404` được áp dụng ở endpoint nào?
16. Cơ chế optimistic/pessimistic concurrency nào phù hợp?
17. Có test framework sẵn hay dùng acceptance scripts?

## 7.5 Output

Tạo:

```text
docs/task-008/TASK008_DISCOVERY_REPORT.md
docs/task-008/TASK008_DECISION_MATRIX.md
docs/task-008/TASK008_MIGRATION_NUMBERING_DECISION.md
docs/task-008/TASK008_IMPLEMENTATION_MANIFEST.md
docs/task-008/TASK008_EXECUTION_STATE.md
```

## 7.6 Gate P1

Chỉ PASS khi:

- mọi row REUSE/EXTEND/REPLACE/DEPRECATED có evidence;
- không còn hai nguồn canonical cho cùng khái niệm;
- migration version đã kiểm tra source và DB;
- ownership và privacy rõ;
- backfill rõ;
- không có unresolved schema blocker.

Verdict:

```text
DISCOVERY_GATE_PASS
```

Nếu thiếu database runtime:

```text
DISCOVERY_GATE_BLOCKED_DB_RUNTIME
```

Không được tạo migration khi blocked.

---

# 8. PHASE 2 — Architecture Decision và migration contract

## 8.1 Mục tiêu

Khóa thiết kế trước khi viết implementation.

## 8.2 ADR bắt buộc

Tạo:

```text
docs/task-008/adr/ADR-001-workout-template-canonical-model.md
docs/task-008/adr/ADR-002-coach-member-scope.md
docs/task-008/adr/ADR-003-session-snapshot.md
docs/task-008/adr/ADR-004-timezone-and-progress.md
docs/task-008/adr/ADR-005-migration-numbering.md
docs/task-008/adr/ADR-006-media-policy.md
```

Mỗi ADR có:

```text
Context
Evidence
Decision
Alternatives rejected
Compatibility impact
Migration/backfill
Security impact
Rollback strategy
Acceptance evidence
```

## 8.3 Candidate migration split

Chỉ dùng khi Discovery xác nhận:

```text
0007_task008_workout_foundation.sql
  - compatible Exercises extension
  - canonical Program template structures
  - ordering, checks, indexes
  - safe legacy backfill/compatibility

0008_task008_assignments_sessions.sql
  - Coach–Member scope nếu cần
  - Assignment
  - Schedule
  - Session extension/replacement
  - Session Exercise Snapshot
  - Set Logs
  - concurrency indexes

0009_task008_progress_entries.sql
  - chỉ khi cần manual measurements
```

Không tạo placeholder migration trống.

## 8.4 Migration design review

Trước khi apply:

- Script phải chạy trong transaction của runner.
- Dùng `IF OBJECT_ID` để phân nhánh compatibility, nhưng phải `THROW` khi schema không đúng shape.
- Không silently skip.
- Backfill deterministic.
- Không mất ID lịch sử.
- Không làm FK cascade xóa lịch sử.
- Check constraint phải khớp enum backend.
- Filtered unique index phải bảo vệ:
  - active Coach–Member pair;
  - primary active Assignment per Member;
  - one in-progress Session per Member;
  - unique set number per Session Exercise.
- Có index phục vụ list theo role, date và status.
- Không index dư thừa.
- Review migration bằng dry-run trên isolated clone trước canonical.

## 8.5 Gate P2

PASS khi:

```text
schema contract approved
API contract draft approved
migration SQL reviewed
backfill reviewed
rollback documented
no Marketplace object touched
```

Verdict:

```text
P2_ARCHITECTURE_GATE_PASS
```

---

# 9. PHASE 3 — Exercise Library

## 9.1 Task mapping

```text
A2 — phần migration foundation
A3 — Exercise Library
A11 — route/authorization liên quan Exercise
A12 — test nhỏ cho Exercise
```

## 9.2 Backend

Hoàn thiện:

- Public:
  - list active;
  - detail active;
  - taxonomy/filter.
- Admin:
  - list active/inactive;
  - detail;
  - create;
  - update;
  - deactivate/reactivate.
- Coach:
  - read active;
  - không mutate global Exercise.
- Validation:
  - strict schema;
  - trim;
  - length bounds;
  - enum allowlist;
  - positive duration;
  - safe media URL;
  - slug unique và deterministic;
  - unknown field rejection.
- Query:
  - parameterized;
  - pagination max;
  - sort allowlist;
  - escaped search;
  - no `SELECT *` cho public DTO nếu field nhạy cảm được bổ sung.
- Error:
  - 400 invalid;
  - 404 concealed/not found;
  - 409 slug conflict;
  - consistent response envelope.

## 9.3 Frontend

- Giữ public library/detail.
- Sửa service dùng shared Axios instance.
- Type mapping thống nhất.
- Admin list/create/edit.
- Search/filter/sort/pagination.
- Loading/empty/error/retry.
- React modal/dialog.
- Không `window.alert`, `window.confirm`.
- Responsive mobile.
- Keyboard/focus/label/aria.
- Không hiển thị field không có trong API.

## 9.4 Acceptance

- Guest đọc active.
- Guest không thấy inactive.
- Coach đọc active.
- Coach mutation bị chặn.
- Member mutation bị chặn.
- Admin CRUD.
- Duplicate slug.
- Unsafe URL.
- Unknown field.
- Pagination/sort injection.
- Deactivate không phá lịch sử.

## 9.5 Gate P3

```text
backend build PASS
backend lint PASS hoặc baseline exception documented
frontend build PASS
Exercise API acceptance PASS
Exercise browser smoke PASS
git diff --check PASS
```

Verdict:

```text
P3_EXERCISE_LIBRARY_GATE_PASS
```

---

# 10. PHASE 4 — Workout Program và Program Builder

## 10.1 Task mapping

```text
A4
A11 phần Program
A12 ownership/state test
```

## 10.2 Data model

Canonical model phải hỗ trợ:

```text
Program
  └── Program Day
        └── Program Exercise
```

Program:

```text
name
description
goal
difficulty
duration_weeks
days_per_week
owner_coach_id nullable theo ADR
created_by
is_active
timestamps
```

Day:

```text
week_number
day_number
title
description
sort_order
```

Exercise item:

```text
exercise_id
sort_order
target_sets
target_reps_min
target_reps_max
target_weight
target_duration_seconds
rest_seconds
tempo
coach_note
```

Validation:

- ít nhất reps hoặc duration;
- min <= max;
- values finite;
- bound hợp lý;
- active Exercise khi thêm mới;
- stable order;
- không duplicate order;
- không duplicate Exercise nếu nghiệp vụ cấm.

## 10.3 Authorization

- Admin quản lý toàn bộ.
- Coach chỉ quản lý Program thuộc ownership đã chốt.
- Member chỉ đọc Program đã được Assignment cấp.
- Cross-Coach resource dùng owner-filtered query, không query rồi trả 403 tiết lộ tồn tại.
- Program inactive không được gán mới.
- Program đã được dùng không hard delete.

## 10.4 Builder UI

- Program list.
- Create/edit metadata.
- Day builder.
- Exercise picker.
- Reorder bằng accessible controls; drag-and-drop chỉ thêm nếu library sẵn và không tăng rủi ro.
- Inline validation.
- Unsaved changes warning bằng React mechanism.
- Save state rõ.
- Error per operation.
- Clone Program nếu ADR cho phép.
- Không giữ `samplePrograms` như dữ liệu production.

## 10.5 Gate P4

```text
Admin Program CRUD PASS
Coach ownership PASS
cross-Coach IDOR PASS
reorder PASS
inactive Exercise rule PASS
snapshot chưa triển khai nhưng Program contract ổn định
backend/frontend build PASS
```

Verdict:

```text
P4_PROGRAM_BUILDER_GATE_PASS
```

---

# 11. PHASE 5 — Coach–Member, Assignment và Schedule

## 11.1 Task mapping

```text
A5
A6
A2 phần migration assignment
A11 phần role routes
A12 scope/duplicate/date test
```

## 11.2 Coach–Member scope

Nếu dùng relation riêng, tối thiểu:

```text
id
coach_id
member_id
assigned_by
status
start_date
end_date
created_at
updated_at
row_version nếu ADR chọn optimistic concurrency
```

Invariant:

- user coach phải active và role coach;
- user member phải active và role member;
- một active pair;
- start <= end;
- Member không tự tạo scope;
- Coach không tự nhận Member nếu policy không cho;
- unassign không xóa lịch sử;
- active scope là điều kiện cho Coach xem dữ liệu hiện tại.

Nếu reuse CRM, phải bổ sung constraint/state/history đủ tương đương.

## 11.3 Assignment

```text
member_id
program_id
assigned_by
coach_id
start_date
end_date
status
schedule_timezone
note
is_primary nếu thiết kế cần
timestamps
```

Invariant:

- tối đa một primary ACTIVE Assignment per Member;
- Program active;
- Coach active scope với Member;
- Member không sửa Program;
- không date overlap trái policy;
- timezone IANA hợp lệ;
- pause/complete/cancel theo state machine.

## 11.4 Schedule

- Generate deterministic từ Program Day và Assignment.
- Idempotent generation.
- Không duplicate date/day.
- Không dùng server local timezone.
- Không regenerate làm mất trạng thái lịch đã hoàn thành.
- Quy tắc khi Program thay đổi phải được ADR hóa:
  - chỉ lịch tương lai chưa bắt đầu;
  - hoặc không tự sync;
  - không tác động Session đã tạo.

## 11.5 Gate P5

```text
Coach scope PASS
cross-Coach concealed 404 PASS
one active Assignment PASS
date/timezone validation PASS
schedule idempotency PASS
Member self read PASS
build PASS
```

Verdict:

```text
P5_ASSIGNMENT_SCHEDULE_GATE_PASS
```

---

# 12. PHASE 6 — Workout Session và immutable snapshot

## 12.1 Task mapping

```text
A7
A11 Member routes
A12 state/concurrency/snapshot test
```

## 12.2 State machine

Canonical transitions:

```text
SCHEDULED → IN_PROGRESS → COMPLETED
SCHEDULED → CANCELLED
IN_PROGRESS → ABANDONED
```

Terminal:

```text
COMPLETED
CANCELLED
ABANDONED
```

Không cho:

```text
terminal → bất kỳ state khác
complete hai lần
start hai lần
Member khác thao tác
Coach tự log thay Member
```

## 12.3 Snapshot

Khi Session được tạo/start theo ADR, transaction phải:

1. lock Assignment/Schedule;
2. validate owner/state/date;
3. tạo hoặc chuyển Session;
4. copy Program Exercise thành Session Exercise;
5. commit cùng transaction.

Snapshot field tối thiểu:

```text
exercise_id
exercise_name
sort_order
target_sets
target_reps_min
target_reps_max
target_weight
target_duration_seconds
rest_seconds
coach_note
```

Sau commit:

- Program edit không thay đổi snapshot.
- Exercise rename/deactivate không thay đổi snapshot name.
- Historical query ưu tiên snapshot.

## 12.4 Concurrency

Database phải ngăn hai `IN_PROGRESS` Session cho một Member.

Pattern đề xuất:

```text
transaction
UPDLOCK + HOLDLOCK
filtered unique index
catch unique violation → 409
```

Không chỉ kiểm tra ở application.

## 12.5 Gate P6

```text
valid transitions PASS
terminal immutability PASS
duplicate start race PASS
cross-Member IDOR PASS
snapshot integrity PASS
program edit regression PASS
build PASS
```

Verdict:

```text
P6_SESSION_SNAPSHOT_GATE_PASS
```

---

# 13. PHASE 7 — Set Logs

## 13.1 Task mapping

```text
A8
A11 API/service
A12 validation/concurrency
```

## 13.2 Model

```text
session_exercise_id
set_number
reps
weight_kg
duration_seconds
distance_meters
completed
note
created_at
updated_at
row_version nếu cần
```

## 13.3 Rules

- Chỉ owning Member.
- Session phải `IN_PROGRESS`.
- Set number positive và unique per Session Exercise.
- Reps/weight/duration/distance finite và không âm.
- At least one meaningful metric theo exercise target.
- Không update sau Session terminal.
- Không đổi `session_exercise_id`.
- Không tạo log cho Exercise không thuộc Session.
- Concurrency duplicate trả 409.
- Complete Session phải validate policy về set chưa hoàn thành.

## 13.4 UI

- Session exercise cards.
- Nhập từng set.
- Keyboard/mobile friendly.
- Optimistic UI chỉ dùng khi rollback rõ.
- Save indicator.
- Error đúng set.
- Confirm complete/abandon bằng dialog.
- Không mất input khi API lỗi.

## 13.5 Gate P7

```text
create/update set PASS
invalid number PASS
duplicate race PASS
terminal immutable PASS
cross-Member PASS
UI logging smoke PASS
build PASS
```

Verdict:

```text
P7_SET_LOG_GATE_PASS
```

---

# 14. PHASE 8 — Progress, dashboard, route và menu integration

## 14.1 Task mapping

```text
A9
A10
A11 hoàn thiện
A12 privacy/formula/timezone
```

## 14.2 Công thức canonical

Completed Sessions:

```text
count Session status COMPLETED
```

Total Duration:

```text
sum total_duration_seconds
chỉ Session COMPLETED
```

Training Volume:

```text
sum(reps * weight_kg)
chỉ completed Set
thuộc Session COMPLETED
```

Completion Rate:

```text
completed due schedules / all due schedules * 100
```

Exclude:

```text
future schedule
cancelled
abandoned
incomplete set
out-of-range time bucket
```

Zero denominator:

```text
0 hoặc null theo ADR, không NaN/Infinity
```

## 14.3 Timezone

- Store UTC.
- Schedule date và aggregation theo Assignment/User IANA timezone.
- Test ranh giới ngày/tháng.
- Không dùng timezone máy chủ làm mặc định ngầm.
- UI format nhất quán.

## 14.4 Privacy

- Member: chính mình.
- Coach: active-scoped Member.
- Admin: operational access.
- Không public endpoint.
- Không log body metrics vào audit/runtime log.
- Không chẩn đoán y tế.

## 14.5 Dashboard

### Member

- Today’s workout.
- Current Program.
- Upcoming Schedule.
- Recent Session.
- Completion rate.
- Volume.
- History.

### Coach

- Active scoped Members.
- Assignment summary.
- Upcoming schedule.
- Recent sessions.
- Progress attention list có dữ liệu thật.
- Không còn placeholder nếu API đã cung cấp.

### Admin

- Exercise/Program operational overview.
- Assignment/progress search theo scope quản trị.
- Không biến thành dashboard analytics ngoài TASK-008.

## 14.6 Shared integration

Chỉ ở phase này mới sửa tập trung:

```text
backend/src/app.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/**
```

Quy tắc:

- diff tối thiểu;
- không reformat toàn file;
- giữ Marketplace routes;
- route name không đụng seller/admin marketplace;
- một lần integration thay vì sửa lặp nhiều phase;
- smoke test mọi role hiện có.

## 14.7 Gate P8

```text
formula fixtures PASS
timezone fixtures PASS
progress privacy PASS
Member dashboard PASS
Coach dashboard PASS
routes/menu PASS
existing Marketplace route smoke PASS
backend/frontend build PASS
```

Verdict:

```text
P8_PROGRESS_DASHBOARD_GATE_PASS
```

---

# 15. PHASE 9 — Full security, acceptance và closure

## 15.1 Acceptance database

Tên:

```text
GYMFIT_DB_TASK008_ACCEPTANCE_<timestamp>
```

Không mutation canonical.

Quy trình:

1. xác minh database target;
2. backup baseline theo quy trình hiện có;
3. verify backup;
4. restore isolated DB;
5. trỏ environment acceptance vào isolated DB;
6. apply migration;
7. seed fixtures có prefix rõ;
8. chạy tests;
9. cleanup;
10. drop isolated DB;
11. kiểm tra canonical count/checksum không đổi.

## 15.2 Actor matrix

```text
Guest
Member A
Member B
Coach A
Coach B
Admin
Seller regression actor nếu route guard chung bị sửa
```

## 15.3 IDOR matrix

- Member A đọc Assignment Member B.
- Member A đọc Session Member B.
- Member A ghi Set Member B.
- Coach A đọc Member Coach B.
- Coach A sửa Program Coach B.
- Coach không active scope đọc progress.
- Path ID tồn tại nhưng ngoài scope phải trả concealed response theo policy.

## 15.4 Concurrency matrix

- duplicate active Coach–Member;
- duplicate primary active Assignment;
- duplicate schedule generation;
- two Session starts;
- duplicate set number;
- double complete;
- concurrent Program reorder;
- optimistic row version conflict nếu dùng.

## 15.5 Regression

- Auth refresh/session.
- Role guards.
- Public Exercises.
- Public Coaches.
- Booking.
- Marketplace public routes.
- Seller/Admin route reachability.
- Existing build and migration checksum.

## 15.6 Security review

Kiểm tra:

```text
SQL injection
mass assignment
unsafe sort
IDOR
role escalation
JWT identity bypass
unsafe media scheme
XSS through notes/instructions
sensitive logging
race condition
missing transaction
over-broad DTO
hard-coded API URL
timezone bug
floating-point/NaN
terminal state mutation
```

## 15.7 Final commands

```bash
cd backend
npm run build
npm run lint
npm run db:migrate:status

cd ../frontend
npm run build

cd ..
git diff --check
git status --short
```

## 15.8 Docs update

Chỉ sau tests thật:

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

Không ghi PASS cho test chưa chạy.

## 15.9 Gate P9

Verdict cuối chỉ một trong:

```text
FULL_TASK_008_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

`FULL_TASK_008_COMPLETE` chỉ khi:

- Discovery PASS;
- migration PASS;
- Gate P3–P8 PASS;
- security/IDOR/concurrency PASS;
- browser role flows PASS;
- isolated DB cleanup PASS;
- canonical integrity PASS;
- final build PASS;
- docs đúng;
- không còn secret/test artifact;
- files changed đúng scope.

---

# 16. API design checklist

Exact route phải được chốt ở ADR, nhưng route family phải rõ:

```text
Public Exercise
Admin Exercise
Admin/Coach Workout Program
Admin/Coach Coach–Member/Assignment
Member self Assignment/Schedule
Member self Session/Set
Member/Coach/Admin Progress
```

Mỗi endpoint phải có:

```text
method
path
role
ownership
request schema
response DTO
pagination
sort allowlist
state precondition
transaction boundary
error mapping
audit requirement
acceptance case
```

Không tạo endpoint chỉ để phục vụ một component nếu endpoint hiện có có thể mở rộng sạch.

---

# 17. Frontend quality checklist

## Functional

- Không mock production data.
- Không hard-code localhost.
- Không fabricated KPI.
- Không duplicate API calls không cần thiết.
- Không stale state sau mutation.
- Query loading/error rõ.
- Form validation khớp backend.

## UI/UX

- Desktop và mobile.
- Text tiếng Việt nhất quán ở dashboard protected.
- Public page giữ style hiện có.
- Button state: default/hover/focus/disabled/loading.
- Empty state có hành động phù hợp.
- Modal focus trap/escape/restore focus.
- Table có mobile strategy.
- Không icon thay cho label quan trọng.
- Không màu là tín hiệu duy nhất.
- Không chữ quá nhỏ.

## Maintainability

- Tách page/service/type/components.
- Không component khổng lồ nếu có thể tách theo nghiệp vụ.
- Không abstraction sớm quá mức.
- Reuse shared primitives.
- Không copy business rule vào frontend làm nguồn sự thật.

---

# 18. Backend quality checklist

- Route → validation → controller/service → SQL rõ.
- Không raw body spread vào SQL.
- Không `any` mới nếu có thể định kiểu.
- Không `SELECT *` cho protected DTO mới.
- Không duplicate state machine ở nhiều nơi; dùng helper/domain policy.
- Error mapping unique constraint → 409.
- Transaction rollback an toàn.
- Audit mutation quan trọng nhưng không log dữ liệu nhạy cảm.
- Pagination bounded.
- Sort allowlist.
- Date/time parsing explicit.
- UTC explicit.
- Owner query atomic.
- Concealed 404 nhất quán.
- Index hỗ trợ query thật.

---

# 19. Stop conditions

Codex được tự sửa lỗi và tiếp tục, nhưng phải dừng phase hiện tại khi:

1. Database target là canonical và lệnh sắp mutation acceptance data.
2. Migration checksum mismatch.
3. Migration version collision.
4. Existing table shape khác hoàn toàn và không có backfill an toàn.
5. Cần sửa Marketplace backend/database.
6. Cần secret hoặc credential không có.
7. Cần destructive reset/drop canonical.
8. Build lỗi baseline không liên quan và ngăn xác minh.
9. Hai tài liệu authoritative mâu thuẫn nhưng source/DB không đủ để quyết định.
10. Worktree safety không đảm bảo.

Khi blocked phải ghi:

```text
exact blocker
evidence
commands run
files unchanged/changed
safe next action
```

Không bypass.

---

# 20. File ownership dự kiến

Được tạo/sửa trong TASK-008 sau Discovery:

```text
backend/src/modules/exercises/**
backend/src/modules/workout-programs/**
backend/src/modules/coach-members/**
backend/src/modules/workout-assignments/**
backend/src/modules/workout-sessions/**
backend/src/modules/progress/**
backend/src/scripts/task-008-*.ts
frontend/src/pages/exercises/**
frontend/src/pages/workouts/**
frontend/src/pages/progress/**
frontend/src/pages/coaches/**
frontend/src/pages/members/**
frontend/src/services/*workout*
frontend/src/services/exercises.ts
frontend/src/types/*workout*
frontend/src/components/workouts/**
db/migrations/0007_*.sql đến 0049_*.sql theo ADR
docs/task-008/**
logs/TASK-008_*.md
```

Shared integration only:

```text
backend/src/app.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/**
```

Cấm sửa Marketplace paths đã nêu ở phần 4.6.

---

# 21. Definition of Ready cho từng phase

Một phase chỉ bắt đầu khi:

- phase trước PASS;
- execution state cập nhật;
- input commit sạch;
- migration status không mismatch;
- allowed files rõ;
- acceptance cases đã viết trước hoặc cùng lúc implementation;
- không unresolved blocker từ ADR.

---

# 22. Definition of Done cho từng phase

Một phase chỉ kết thúc khi:

- code chạy được;
- test liên quan PASS;
- build gate PASS;
- security scope PASS;
- docs/manifest cập nhật;
- diff không có file ngoài scope;
- commit checkpoint tạo thành công;
- worktree sạch sau commit;
- next phase input được ghi.

---

# 23. Báo cáo cuối theo thứ tự bắt buộc

```text
1. PREFLIGHT
2. SAFETY SNAPSHOT
3. WORKTREE / BRANCH / BASELINE
4. BASELINE BUILD
5. DISCOVERY
6. DECISION MATRIX
7. MIGRATION NUMBERING
8. DATA MODEL
9. EXERCISE LIBRARY
10. WORKOUT PROGRAM
11. PROGRAM BUILDER
12. COACH–MEMBER
13. ASSIGNMENT
14. SCHEDULE
15. SESSION
16. SNAPSHOT
17. SET LOGS
18. PROGRESS
19. MEMBER DASHBOARD
20. COACH DASHBOARD
21. ROUTE/MENU
22. AUTHORIZATION
23. IDOR
24. CONCURRENCY
25. TIMEZONE
26. MEDIA
27. ADMIN BROWSER
28. COACH BROWSER
29. MEMBER BROWSER
30. REGRESSION
31. MIGRATION STATUS
32. ACCEPTANCE CLEANUP
33. CANONICAL INTEGRITY
34. FINAL BUILD
35. FILES CHANGED
36. COMMITS
37. PUSH STATUS
38. REMAINING ISSUES
39. FINAL VERDICT
```

---

# 24. Lệnh chạy

Đặt folder `TASK008_CODEX_PACKAGE` ở repository root và chạy PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\TASK008_CODEX_PACKAGE\RUN_TASK008_CODEX.ps1
```

Nếu package nằm ngoài repository:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\path\TASK008_CODEX_PACKAGE\RUN_TASK008_CODEX.ps1" -RepoPath "D:\path\Web-GYM"
```

Script sẽ:

1. tạo safety snapshot;
2. tạo/reuse worktree riêng;
3. copy instruction files vào worktree;
4. chạy Discovery prompt;
5. chỉ khi `DISCOVERY_GATE_PASS` mới chạy Implementation prompt;
6. lưu final output vào `logs/`;
7. không tự push.

---

# 25. Kết luận triển khai

Phương án này cố ý chia TASK-008 thành nhiều gate nhỏ, nhưng vẫn cho Codex chạy dài và tự chủ. Chất lượng được bảo vệ bằng:

```text
worktree isolation
source-of-truth precedence
discovery before migration
ADR before code
one-way dependencies
phase file boundaries
database constraints
isolated acceptance DB
checkpoint commits
shared integration late
full security matrix
no automatic push
```

Không bắt đầu Phase 3 nếu Phase 1 hoặc Phase 2 chưa PASS.
