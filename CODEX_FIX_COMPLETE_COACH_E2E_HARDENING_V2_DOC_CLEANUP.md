# CODEX MASTER FIX PROMPT — COMPLETE COACH E2E HARDENING

Bạn là Codex đang làm việc như Senior Full-Stack Engineer, SQL Server Engineer, Security Engineer, Test Engineer và Documentation Engineer trong repository GymFit.

# STATE

Branch hiện tại:

```text
feat/vinh-coach-member-e2e
```

Baseline:

```text
START COMMIT: 21f69017b0c4f2f5933998b0382d0676b0e83a16
Coach Workspace: implemented
Member Workout Flow: implemented
Migration 0007: applied
Migration 0008: applied
Canonical DB status: 20 applied, 0 pending, 0 checksum mismatch
Backend build: PASS
Frontend build: PASS
Frontend tsc: còn 3 lỗi cũ ngoài phạm vi
```

Audit kết luận hiện tại:

```text
OVERALL: PARTIALLY_COMPLETE
```

Lý do:

1. Member Session History frontend đang đọc response sai contract.
2. Member Progress frontend đang đọc `recent_sessions` sai contract.
3. Set Logs frontend chưa có update/edit đầy đủ.
4. `/progress/sessions` chưa phải trang lịch sử riêng.
5. `/progress/exercises/:exerciseId` chưa dùng `exerciseId`.
6. Upcoming schedules còn lẫn lịch cũ.
7. Start button chưa phản ánh khả năng start thật.
8. Current Assignment chưa kiểm tra start/end date.
9. Timezone chưa đồng nhất giữa Member và Coach.
10. CRM Coach scope và Active Assignment có thể lệch.
11. Member Dashboard đang nuốt lỗi API.
12. Tài liệu còn mâu thuẫn/stale.
13. Repository có line-ending/untracked-file noise.
14. ZIP có `.env`; không được stage hoặc commit.

Mục tiêu:

```text
Sửa toàn bộ các lỗi trên.
Chỉ kết luận FULL_COACH_BUSINESS_E2E_COMPLETE khi frontend chạy đúng với dữ liệu Session/Progress thật.
```

---

# PHẠM VI ĐƯỢC SỬA

## Backend

```text
backend/src/modules/coach-workspace/**
backend/src/modules/member-workouts/**
backend/src/modules/members/**
backend/src/modules/coaches/**
backend/src/shared/**
```

Chỉ sửa shared backend helper khi trực tiếp phục vụ timezone, validation hoặc transaction của Coach/Member Workout.

## Frontend

```text
frontend/src/pages/coaches/**
frontend/src/pages/workouts/**
frontend/src/pages/progress/**
frontend/src/pages/dashboard/**
frontend/src/services/coachWorkspaceApi.ts
frontend/src/services/memberWorkoutApi.ts
frontend/src/types/coachWorkspace.ts
frontend/src/types/memberWorkout.ts
frontend/src/components/workouts/**
frontend/src/components/progress/**
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
```

## Database

- Không sửa migration `0007`.
- Không sửa migration `0008`.
- Chỉ tạo migration mới nếu thật sự cần constraint/index/schema fix.
- Migration mới phải dùng số khả dụng tiếp theo sau khi kiểm tra ledger.

## Documentation

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
docs/README.md
docs/ARCHITECTURE.md
docs/API_AND_AUTHORIZATION.md
docs/DATABASE_AND_MIGRATIONS.md
docs/KNOWN_LIMITATIONS.md
docs/coach/**
```

---

# PHẦN TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA

## Marketplace

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

## Video

```text
frontend/src/pages/video/**
frontend/src/components/MediaPlayer.tsx
frontend/src/services/videos.ts
backend/src/modules/videos/**
```

## Admin

```text
frontend/src/pages/admin/**
```

## TypeScript errors cũ ngoài phạm vi

Không sửa:

```text
frontend/src/components/products/ProductCard.tsx
frontend/src/pages/reviews/ReviewsPage.tsx
frontend/src/services/reviewsApi.ts
```

## Không triển khai

```text
Admin Coach Management
Video Library
Membership Video Access
Marketplace
Seller
Payment
Refund
Settlement
AI Recommendation
Camera
Pose Estimation
Automatic Rep Counting
Nutrition
Medical Diagnosis
Wearables
Live Coaching
```

---

# PHASE 0 — BASELINE, GIT VÀ SCOPE GATE

Chạy:

```bash
git branch --show-current
git rev-parse HEAD
git status
git log --oneline -5
git diff 9d784e6..HEAD --name-only
```

Yêu cầu:

```text
Branch = feat/vinh-coach-member-e2e
HEAD = 21f69017b0c4f2f5933998b0382d0676b0e83a16
```

Nếu HEAD khác:

- Không reset.
- Ghi actual HEAD.
- Audit diff actual.
- Chỉ tiếp tục nếu thay đổi vẫn thuộc Coach/Member Workout.

Kiểm tra line ending:

```bash
git config --get core.autocrlf
git status --short
```

Không stage file chỉ thay đổi CRLF.

Liệt kê untracked:

```bash
git ls-files --others --exclude-standard
```

Không commit:

```text
CODEX_*.md
TASK008_CODEX_APP_PACKAGE/
TASK008_CODEX_APP_PACKAGE.zip
backend/.env
*.bak
*.backup
*.log
acceptance artifacts
dist/
node_modules/
```

Verdict:

```text
P0_SCOPE_GATE_PASS
```

---

# PHASE 1 — FIX MEMBER SESSION LIST CONTRACT

## Backend contract audit

Kiểm tra endpoint list sessions và response thật.

Backend hiện được audit là trả flat fields kiểu:

```text
id
member_id
program_id
program_name
day_title
scheduled_date
schedule_status
status
started_at
completed_at
total_duration_seconds
```

Không giả định nested response.

## Frontend type

Tạo canonical type đúng API:

```ts
export interface MemberSessionListItem {
  id: number;
  member_id: number;
  program_id: number;
  program_name: string;
  day_title: string | null;
  scheduled_date: string;
  schedule_status: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  total_duration_seconds: number | null;
}
```

Điều chỉnh theo response thực tế nếu field nullability khác.

## Frontend UI

Thay toàn bộ:

```ts
session.program.name
session.schedule.scheduled_date
```

bằng:

```ts
session.program_name
session.scheduled_date
```

Xóa:

```ts
as unknown as MemberSession[]
as any
```

Không dùng type assertion để che mismatch.

## Acceptance

Seed ít nhất:

- 1 Completed Session.
- 1 Abandoned Session.

Mở:

```text
/workouts/sessions
```

Yêu cầu:

- Không crash.
- Hiển thị đúng Program.
- Hiển thị đúng scheduled date.
- Hiển thị đúng status/duration.
- Không console error.

Verdict:

```text
P1_SESSION_CONTRACT_PASS
```

---

# PHASE 2 — FIX MEMBER PROGRESS CONTRACT

## Backend response audit

Audit `recent_sessions`.

Backend hiện được ghi nhận trả flat row:

```text
id
program_id
program_name
day_title
scheduled_date
status
completed_at
total_duration_seconds
```

## Frontend type

Tạo canonical type:

```ts
export interface RecentWorkoutSession {
  id: number;
  program_id: number;
  program_name: string;
  day_title: string | null;
  scheduled_date: string;
  status: string;
  completed_at: string | null;
  total_duration_seconds: number;
}
```

## UI

Thay:

```ts
session.program.name
session.schedule.scheduled_date
```

bằng flat fields.

Xóa mọi `as unknown as`.

## Acceptance

Với completed session thật:

- `/progress` render được.
- Recent Session hiển thị đúng.
- Progress summary không crash.
- Không console error.

Verdict:

```text
P2_PROGRESS_CONTRACT_PASS
```

---

# PHASE 3 — COMPLETE SET LOG FRONTEND CRUD

Backend đã có create/update/delete.

Frontend phải hỗ trợ đầy đủ:

```text
Create
Read
Update
Delete
Mark completed
Mark draft/incomplete nếu contract hỗ trợ
```

Fields UI:

```text
set_number
reps
weight_kg
duration_seconds
distance_meters
completed
note
```

Yêu cầu:

- Edit existing Set.
- Save gọi `updateMemberSet()`.
- Delete có confirm dialog.
- Inline validation.
- Không reset form khi API lỗi.
- Loading/disabled state.
- Duplicate set number hiển thị `409` rõ.
- Terminal Session disable edit/delete.
- Mobile-first.
- Không tạo field nếu backend contract không hỗ trợ; nếu backend hỗ trợ thì UI phải expose.

Không được tiếp tục ghi “CRUD complete” nếu update chưa có.

Acceptance:

- Add Set.
- Edit reps/weight.
- Edit duration/distance/note.
- Toggle completed.
- Delete Set.
- Reload page dữ liệu vẫn đúng.
- Completed Session không sửa được.

Verdict:

```text
P3_SET_LOG_CRUD_PASS
```

---

# PHASE 4 — IMPLEMENT DEDICATED PROGRESS PAGES

## `/progress/sessions`

Không dùng lại nguyên Progress Dashboard.

Tạo focused page:

- Completed Sessions.
- Abandoned Sessions.
- Date range.
- Status filter.
- Pagination.
- Program name.
- Day title.
- Scheduled date.
- Completed date.
- Duration.
- Exercise count/summary.
- Link Session Detail.

Nếu API chưa hỗ trợ filter/pagination, mở rộng Member Workout backend trong đúng module.

## `/progress/exercises/:exerciseId`

Phải đọc:

```ts
const { exerciseId } = useParams();
```

API:

```text
GET /api/member/workouts/progress/exercises/:exerciseId
```

Response tối thiểu:

```text
exercise
last_performed_at
session_count
total_sets
total_reps
max_weight_kg
total_volume
history[]
```

History:

```text
session_id
completed_at
set_number
reps
weight_kg
duration_seconds
distance_meters
volume
```

Rule:

- Self-only.
- Exercise phải thuộc lịch sử Session của Member.
- Out-of-scope trả concealed `404`.
- Không public.
- Không NaN/Infinity.

UI:

- Exercise name.
- Last trained.
- Volume trend.
- Reps/weight history.
- Session links.
- Empty/error/loading.
- Responsive.

Verdict:

```text
P4_DEDICATED_PROGRESS_PAGES_PASS
```

---

# PHASE 5 — FIX UPCOMING SCHEDULES

Audit `getCurrent()`.

Upcoming schedules phải chỉ gồm:

```text
status IN ('SCHEDULED', 'IN_PROGRESS')
scheduled_date >= today_in_assignment_timezone
```

Không gồm:

```text
COMPLETED
SKIPPED
CANCELLED
past SCHEDULED
```

Order:

```text
scheduled_date ASC
```

Limit chỉ áp dụng sau đúng filter.

Backend nên trả:

```text
can_start
blocked_reason
```

`can_start = true` chỉ khi:

- Schedule thuộc Member.
- Assignment active và trong date range.
- Schedule status `SCHEDULED`.
- Ngày được phép start theo timezone.
- Member không có Session khác `IN_PROGRESS`.

Không tự tính `can_start` chỉ ở frontend.

Verdict:

```text
P5_UPCOMING_SCHEDULE_PASS
```

---

# PHASE 6 — ENFORCE ASSIGNMENT DATE RANGE

Current Assignment phải thỏa:

```text
status = ACTIVE
start_date <= today_in_assignment_timezone
end_date IS NULL OR end_date >= today_in_assignment_timezone
```

Không trả:

```text
future assignment
expired assignment
paused
completed
cancelled
```

Nếu có nhiều record dữ liệu lỗi:

- Không chọn ngẫu nhiên.
- Chọn theo deterministic rule.
- Ghi audit warning.
- Không tự sửa production data trong request read.

Start Session phải kiểm tra lại date range trong transaction.

Acceptance:

- Future assignment: không current.
- Expired assignment: không current.
- Active valid: current.
- Boundary start/end date: đúng timezone.

Verdict:

```text
P6_ASSIGNMENT_DATE_RANGE_PASS
```

---

# PHASE 7 — NORMALIZE TIMEZONE

Tạo hoặc tái sử dụng helper backend duy nhất:

```ts
getDateInTimeZone(timeZone: string): string
getDateTimeInTimeZone(timeZone: string): ...
```

Không dùng chung một cách mơ hồ nếu type khác.

Dùng thống nhất cho:

- Member current assignment.
- Upcoming schedule.
- Start Session.
- Coach reschedule.
- Coach cancel schedule.
- Coach Dashboard today/upcoming.
- Completion rate.
- Due schedule calculation.

Không trộn:

```text
GETDATE()
server local date
UTC date
browser local date
assignment timezone
```

Database vẫn store UTC/dates theo schema hiện có.

Invalid timezone:

- Validation `422`.
- Không silently fallback server timezone.
- Chỉ fallback canonical default nếu policy/documentation cho phép và ghi rõ.

Acceptance:

- Asia/Ho_Chi_Minh.
- UTC.
- Timezone boundary gần midnight.
- DST timezone nếu helper hỗ trợ IANA.

Verdict:

```text
P7_TIMEZONE_PASS
```

---

# PHASE 8 — RESOLVE CRM SCOPE VS ACTIVE ASSIGNMENT

Audit:

```text
CRMCustomers.assigned_coach_id
CoachMember relation nếu có
MemberWorkoutAssignments.coach_id
```

Chốt canonical authorization:

- Coach read scope phải nhất quán.
- Member active Assignment phải không tồn tại với Coach cũ sau reassignment nếu nghiệp vụ không cho phép.
- Không để old Coach mất scope nhưng Member vẫn tập Program old Coach mà không có owner rõ.

Tạo ADR:

```text
docs/coach/ADR_COACH_REASSIGNMENT_ASSIGNMENT_LIFECYCLE.md
```

ADR phải chọn một rule rõ:

## Recommended

Khi Member được reassigned:

1. Lock CRM/relationship.
2. Lock active Assignment.
3. End old Coach–Member scope.
4. Pause hoặc Cancel old active Assignment theo policy.
5. Không xóa lịch sử Sessions.
6. Gán Coach mới.
7. Coach mới tạo Assignment mới.
8. Transaction commit.

Không tự động chuyển ownership Program giữa Coaches.

Nếu reassignment module nằm ngoài phạm vi hiện tại:

- Tạo service/domain function dùng lại.
- Không sửa Admin UI.
- Acceptance có thể gọi API/service fixture nội bộ.
- Ghi rõ API nào sẽ sử dụng function sau này.

Authorization phải dựa trên canonical current scope, không query hai nguồn mâu thuẫn.

Verdict:

```text
P8_COACH_SCOPE_CONSISTENCY_PASS
```

---

# PHASE 9 — FIX MEMBER DASHBOARD ERROR HANDLING

Tìm:

```ts
.catch(() => undefined)
```

trong Member Workout widget.

Thay bằng state:

```text
loading
data
empty
error
retry
```

Yêu cầu:

- API 404/empty contract → Empty state.
- Network/500 → Error state.
- Retry button.
- Không ẩn widget khi backend lỗi.
- Không spam toast.
- `aria-live` cho error.
- Không làm hỏng Dashboard module khác.

Acceptance:

- Backend available.
- No assignment.
- Backend stopped/500.
- Retry success.
- Mobile layout.

Verdict:

```text
P9_DASHBOARD_ERROR_PASS
```

---

# PHASE 10 — DOCUMENTATION RECONCILIATION

Tìm và xóa/sửa mọi nội dung stale:

```text
TASK-008 NOT STARTED
migration 0006 for TASK-008
18 applied / 1 pending
19 applied / pending 0008
BLOCKED_BY_MEMBER_WORKOUT_FLOW
```

Trạng thái đúng sau fix phải dựa trên migration ledger thực tế.

Cập nhật:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
docs/README.md
docs/ARCHITECTURE.md
docs/API_AND_AUTHORIZATION.md
docs/DATABASE_AND_MIGRATIONS.md
docs/KNOWN_LIMITATIONS.md
docs/coach/COACH_ROLE_HANDOVER.md
docs/coach/COACH_END_TO_END_HANDOVER.md
```

Handover phải ghi:

```text
START COMMIT
END COMMIT
MIGRATIONS
FILES CHANGED
API CONTRACTS
SESSION STATE MACHINE
SNAPSHOT
SET LOG CRUD
PROGRESS PAGES
TIMEZONE
COACH REASSIGNMENT RULE
SECURITY
IDOR
CONCURRENCY
BROWSER
BUILD
KNOWN LIMITATIONS
FINAL VERDICT
```

Không ghi final commit hash trước khi commit tồn tại.

Quy trình:

1. Commit code fix.
2. Lấy code fix hash.
3. Cập nhật docs.
4. Commit docs riêng.
5. Handover ghi cả code fix commit và docs commit.

Verdict:

```text
P10_DOCUMENTATION_PASS
```

---


# PHASE 10A — DOCUMENTATION AUDIT, CONSOLIDATION VÀ CLEANUP

Mục tiêu:

```text
Loại bỏ tài liệu trùng, sai, quá cũ hoặc chỉ dùng tạm.
Giữ một bộ tài liệu canonical rõ ràng để AI và thành viên dự án bám đúng trọng tâm.
```

## 1. Phạm vi tài liệu phải audit

Kiểm tra toàn bộ Markdown thuộc chính repository:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
CONTRIBUTING.md
docs/**/*.md
logs/**/*.md
```

Không audit/xóa tài liệu bên thứ ba:

```text
node_modules/**
skill/**
vendor/**
```

Không coi prompt Codex tạm là tài liệu dự án canonical:

```text
CODEX_*.md
CODEX_*.txt
TASK008_CODEX_APP_PACKAGE/**
```

## 2. Tạo inventory trước khi sửa hoặc xóa

Tạo:

```text
docs/DOCUMENTATION_INVENTORY.md
```

Mỗi file phải được phân loại:

```text
CANONICAL
SUPPORTING
HISTORICAL
DUPLICATE
OBSOLETE
GENERATED_TEMP
THIRD_PARTY
NEEDS_DECISION
```

Mỗi dòng inventory cần có:

```text
path
classification
scope
last verified commit
reason
action
replacement/superseded-by
```

Không xóa file trước khi inventory xác định rõ lý do.

## 3. Bộ tài liệu canonical tối thiểu phải giữ và cập nhật

Giữ một bộ tài liệu nguồn sự thật duy nhất:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
CONTRIBUTING.md
docs/README.md
docs/ARCHITECTURE.md
docs/API_AND_AUTHORIZATION.md
docs/DATABASE_AND_MIGRATIONS.md
docs/KNOWN_LIMITATIONS.md
docs/DOCUMENTATION_GOVERNANCE.md
docs/DOCUMENTATION_INVENTORY.md
docs/coach/COACH_ROLE_HANDOVER.md
docs/coach/COACH_END_TO_END_HANDOVER.md
docs/coach/ADR_*.md
```

Chỉ giữ thêm file khi:

- Có nghiệp vụ riêng chưa được tài liệu canonical khác bao phủ.
- Có giá trị vận hành, migration, acceptance hoặc quyết định kiến trúc.
- Không trùng nội dung với file khác.

## 4. Thứ tự ưu tiên nguồn sự thật

Tạo và ghi rõ trong:

```text
docs/DOCUMENTATION_GOVERNANCE.md
```

Thứ tự ưu tiên:

```text
1. Source code và migration ledger thực tế.
2. README/ROADMAP/PROJECT_STATUS canonical đã verify.
3. Architecture/API/Database docs canonical.
4. ADR và handover mới nhất.
5. Acceptance logs có branch/commit/evidence rõ.
6. Historical/archived docs chỉ dùng tham khảo.
```

Khi tài liệu mâu thuẫn:

- Không giữ cả hai như đều đúng.
- So với source, migration ledger và commit thật.
- Cập nhật file canonical.
- File cũ phải được archive hoặc ghi `SUPERSEDED`.
- Ghi quyết định trong inventory.

## 5. Metadata bắt buộc cho tài liệu quan trọng

Thêm đầu file canonical khi phù hợp:

```text
Status: CANONICAL | ACTIVE | HISTORICAL | SUPERSEDED
Scope:
Last verified branch:
Last verified commit:
Last verified date:
Supersedes:
Superseded by:
```

Không dùng ngày/commit giả.

## 6. Xử lý từng loại file

### CANONICAL

- Giữ nguyên path ổn định.
- Cập nhật đúng source hiện tại.
- Loại nội dung mâu thuẫn, trùng hoặc quá cũ.
- Thêm liên kết tới tài liệu chi tiết.

### SUPPORTING

- Giữ nếu có giá trị kỹ thuật riêng.
- Được index trong `docs/README.md`.
- Không lặp lại status tổng dự án.

### HISTORICAL

Chuyển vào:

```text
docs/archive/<yyyy-mm>/
```

Thêm header:

```text
Status: HISTORICAL
Do not use as implementation source of truth.
Superseded by: <canonical path>
```

Không archive migration, ADR đang active hoặc handover cuối cùng.

### DUPLICATE

- Hợp nhất nội dung còn giá trị vào file canonical.
- Xóa bản duplicate sau khi kiểm tra link/reference.
- Cập nhật mọi link trỏ đến file cũ.

### OBSOLETE

- Nếu không còn giá trị lịch sử: xóa.
- Nếu cần evidence: archive.
- Không giữ file obsolete ở root hoặc `docs/` active.

### GENERATED_TEMP

Xóa khỏi working tree hoặc thêm ignore phù hợp nếu chưa được track:

```text
CODEX prompts tạm
package ZIP tạm
acceptance output tạm
local path handoff
temporary logs
```

Không commit chúng.

### NEEDS_DECISION

- Không tự đoán.
- Ghi vào:
  ```text
  docs/DOCUMENTATION_DECISIONS_PENDING.md
  ```
- Nêu rõ mâu thuẫn, source evidence và quyết định cần nhóm chốt.

## 7. Các mâu thuẫn bắt buộc phải giải quyết

Tìm và sửa mọi nội dung sai/stale liên quan:

```text
TASK-008 NOT STARTED
TASK-008 migration = 0006
migration 0007 pending
migration 0008 pending
BLOCKED_BY_MEMBER_WORKOUT_FLOW
Coach E2E chưa hoàn thành
18 applied / 1 pending
19 applied / 1 pending
baseline commit cũ
route map cũ
API contract cũ
```

Chỉ ghi trạng thái mới sau khi verify bằng:

```text
git rev-parse HEAD
npm run db:migrate:status
source routes/controllers
build/test evidence
```

## 8. `docs/README.md` phải trở thành index duy nhất

`docs/README.md` phải có:

- Bắt đầu từ đâu.
- Tài liệu canonical.
- Tài liệu theo module.
- Coach/Member Workout.
- Marketplace.
- Database/migration.
- API/authorization.
- Known limitations.
- ADR.
- Handover.
- Archive.
- Tài liệu không được dùng làm source of truth.

Không để người đọc phải đoán file nào mới nhất.

## 9. Root README phải ngắn và định hướng

`README.md` chỉ giữ:

- Mục tiêu dự án.
- Stack.
- Cách cài/chạy.
- Role chính.
- Trạng thái high-level đã verify.
- Link tới `docs/README.md`.
- Không nhồi toàn bộ roadmap/spec/history vào root README.
- Không giữ status cũ mâu thuẫn.

## 10. ROADMAP và PROJECT_STATUS phải tách vai trò

### `ROADMAP.md`

Chỉ ghi:

- Workstream.
- Trạng thái.
- Owner.
- Dependency.
- Acceptance gate.
- Next action.

Không chứa hướng dẫn triển khai dài.

### `PROJECT_STATUS.md`

Chỉ ghi snapshot hiện tại:

- Branch/commit đã verify.
- Migration status.
- Build status.
- Module complete/partial/blocked.
- Known blockers.
- Không giữ nhiều snapshot lịch sử nối tiếp nhau trong cùng file.

Lịch sử cũ phải chuyển archive hoặc Git history.

## 11. Link và reference validation

Sau cleanup:

- Kiểm tra toàn bộ Markdown links nội bộ.
- Tìm link tới file đã rename/archive/delete.
- Tìm Windows absolute path:
  ```text
  D:\
  C:\
  ```
- Tìm secret/credential.
- Tìm commit/branch stale.
- Tìm header `NOT STARTED`, `PENDING`, `TODO` không còn đúng.
- Kiểm tra case-sensitive path.

Tạo report:

```text
docs/DOCUMENTATION_CLEANUP_REPORT.md
```

Report phải có:

```text
FILES KEPT
FILES UPDATED
FILES MERGED
FILES ARCHIVED
FILES DELETED
LINKS FIXED
STALE CLAIMS REMOVED
PENDING DECISIONS
CANONICAL DOCUMENT SET
```

## 12. Git safety cho documentation cleanup

Không dùng:

```text
rm -rf docs
git add .
git add -A
git clean
git reset --hard
```

- Stage file cụ thể.
- Trước khi xóa file, dùng `git grep` tìm reference.
- Không xóa migration, source, test hoặc evidence đang được handover canonical tham chiếu.
- Không thay đổi nội dung nghiệp vụ chỉ để tài liệu “đẹp”.
- Mọi claim phải có source evidence.

## 13. Acceptance gate

Chỉ PASS khi:

- Có inventory đầy đủ.
- Có governance.
- `docs/README.md` là index rõ ràng.
- Root README, ROADMAP, PROJECT_STATUS không mâu thuẫn.
- Không còn tài liệu active nói TASK-008 chưa bắt đầu.
- Không còn migration numbering sai.
- Không còn link nội bộ hỏng.
- File duplicate/obsolete đã merge, archive hoặc delete có lý do.
- Prompt/package/log tạm không bị stage.
- Historical docs được đánh dấu rõ.
- Documentation cleanup report đầy đủ.

Verdict:

```text
P10A_DOCUMENTATION_CLEANUP_PASS
```


# PHASE 11 — REPOSITORY HYGIENE

## Line endings

Không commit mass CRLF changes.

Kiểm tra:

```bash
git diff --numstat
git diff --ignore-space-at-eol --stat
```

Nếu status noise do CRLF:

- Không rewrite toàn repo.
- Không stage.
- Chỉ stage file thực sự sửa.
- Không thay `.gitattributes` trong task này trừ khi repository đã có quyết định rõ.

## Untracked

Không stage:

```text
CODEX_*.md
TASK008_CODEX_APP_PACKAGE/
TASK008_CODEX_APP_PACKAGE.zip
backend/.env
backup SQL
acceptance artifacts
```

## Secrets

Không commit `.env`.

Nếu `.env` chứa credential thật và ZIP đã chia sẻ:

- Ghi security note:
  ```text
  ROTATE_JWT_SECRET
  ROTATE_MAIL_APP_PASSWORD
  REVIEW_DB_CREDENTIAL
  ```
- Không tự thay credential trong source nếu user chưa cung cấp giá trị mới.
- Không in secret trong report.

Verdict:

```text
P11_REPOSITORY_HYGIENE_PASS
```

---

# PHASE 12 — FULL ACCEPTANCE WITH REAL DATA

Dùng isolated DB:

```text
GYMFIT_DB_COACH_E2E_FIX_<timestamp>
```

Seed deterministic:

```text
Coach A
Coach B
Member A thuộc Coach A
Member B thuộc Coach B
Program A
Program B
Assignment A valid
Assignment B valid
Future Assignment
Expired Assignment
Past completed Schedule
Future scheduled Schedule
Today scheduled Schedule
Completed Session
Abandoned Session
Multiple Set Logs
```

Test:

## Session UI

- `/workouts/sessions` với dữ liệu thật.
- Program/date/status đúng.
- Không crash.

## Progress UI

- `/progress` với completed Session.
- Recent sessions đúng.
- Không crash.
- Formula đúng.

## Set CRUD

- Create.
- Edit.
- Delete.
- Terminal lock.
- Duplicate conflict.

## Dedicated progress

- `/progress/sessions`.
- `/progress/exercises/:exerciseId`.

## Schedule

- Upcoming không có lịch cũ.
- Start button đúng `can_start`.
- Future date blocked.
- Today allowed.

## Assignment

- Future/expired không current.
- Valid assignment current.

## Timezone

- Member Start.
- Coach reschedule/cancel.
- Dashboard.
- Due completion.

## Scope

- Coach A/Member A.
- Coach B/Member B.
- Cross access denied.
- Reassignment consistency.

## Dashboard error

- API down → error/retry.
- Không assignment → empty.

## Browser matrix

```text
375px
768px
1440px
Member A
Member B
Coach A
Coach B
Guest negative
```

Yêu cầu:

- No console error.
- No horizontal overflow.
- Keyboard/focus.
- Loading/empty/error.
- Real non-empty data.

Cleanup:

1. Delete fixtures.
2. Drop isolated DB.
3. Verify absent.
4. Verify canonical DB unchanged.

Verdict:

```text
P12_FULL_ACCEPTANCE_PASS
```

---

# PHASE 13 — BUILD GATES

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npx tsc --noEmit --pretty false
npm run build
```

Expected:

- Không có Coach/Member Workout TypeScript error.
- Chỉ còn 3 lỗi cũ ngoài scope nếu chưa được task khác sửa:
  ```text
  ProductCard.tsx
  ReviewsPage.tsx
  reviewsApi.ts
  ```
- Không được báo project-wide tsc PASS nếu 3 lỗi còn tồn tại.
- Frontend Vite build PASS.
- Backend build PASS.
- `git diff --check` PASS.
- Không staged file ngoài scope.

Verdict:

```text
P13_BUILD_GATE_PASS
```

---

# GIT STRATEGY

Tạo branch mới:

```bash
git checkout feat/vinh-coach-member-e2e
git checkout -b fix/vinh-coach-e2e-hardening
```

Nếu branch đã tồn tại:

- Không reset.
- Chuyển sang branch và audit HEAD.

Không dùng:

```text
git reset --hard
git clean
git restore .
git checkout -- .
git add .
git add -A
git push
git push --force
```

Stage file cụ thể.

Commit đề xuất:

```text
fix(member-workout): align session and progress contracts
feat(member-workout): complete set log editing
feat(member-progress): add session and exercise history
fix(member-workout): enforce schedule and assignment validity
fix(coach-workout): normalize timezone and reassignment rules
fix(member-dashboard): expose workout loading failures
test(coach-e2e): cover real-data contracts and concurrency
docs(project): inventory and consolidate canonical documentation
docs(project): archive and remove superseded documentation
docs(coach-e2e): reconcile final completion status
```

Không push tự động.

---

# FINAL VERDICT

Chỉ được dùng:

```text
FULL_COACH_BUSINESS_E2E_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

Chỉ báo `FULL_COACH_BUSINESS_E2E_COMPLETE` nếu:

- Session History chạy với dữ liệu thật.
- Progress chạy với completed Session thật.
- Không contract mismatch.
- Set Logs frontend CRUD đầy đủ.
- Progress sessions page riêng.
- Exercise progress page dùng đúng `exerciseId`.
- Upcoming schedules đúng.
- Start UX đúng.
- Assignment date range đúng.
- Timezone thống nhất.
- Coach scope/Assignment nhất quán.
- Dashboard có error/retry.
- Backend build PASS.
- Frontend build PASS.
- Không lỗi Coach/Member Workout trong tsc.
- Security/IDOR/concurrency PASS.
- Browser real-data PASS.
- Documentation nhất quán.
- Documentation inventory và governance đã hoàn thành.
- File README/docs trùng, sai hoặc quá cũ đã được merge, archive hoặc xóa có bằng chứng.
- `docs/README.md` là index canonical duy nhất.
- Markdown links và stale references đã được kiểm tra.
- Acceptance DB cleanup.
- Canonical DB integrity.
- Không sửa Marketplace, Video hoặc Admin pages.
- Không commit secret/untracked package/prompt.

---

# BÁO CÁO CUỐI BẮT BUỘC

```text
FINAL VERDICT
BRANCH
START COMMIT
CODE FIX COMMITS
TEST COMMIT
DOCUMENTATION COMMIT
END COMMIT
MIGRATIONS
FILES CHANGED
SESSION CONTRACT RESULT
PROGRESS CONTRACT RESULT
SET LOG CRUD RESULT
PROGRESS SESSIONS PAGE
EXERCISE PROGRESS PAGE
UPCOMING SCHEDULE RESULT
START ELIGIBILITY RESULT
ASSIGNMENT DATE RANGE RESULT
TIMEZONE RESULT
COACH REASSIGNMENT RESULT
DASHBOARD ERROR RESULT
SECURITY RESULT
IDOR RESULT
CONCURRENCY RESULT
BACKEND BUILD
FRONTEND TYPESCRIPT
PRE_EXISTING OUT-OF-SCOPE ERRORS
FRONTEND BUILD
BROWSER REAL-DATA RESULT
DATABASE CLEANUP
CANONICAL DB INTEGRITY
OUT-OF-SCOPE FILES CHANGED
REPOSITORY HYGIENE
SECRETS NOTE
DOCUMENTATION UPDATED
DOCUMENTATION INVENTORY
CANONICAL DOCS KEPT
DOCS MERGED
DOCS ARCHIVED
DOCS DELETED
BROKEN LINKS FIXED
STALE CLAIMS REMOVED
PENDING DOCUMENTATION DECISIONS
REMAINING ISSUES
NEXT ACTION
```

Không push tự động.
