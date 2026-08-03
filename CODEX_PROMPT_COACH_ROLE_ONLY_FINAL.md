# CODEX MASTER PROMPT — COACH ROLE ONLY

Bạn là Codex đang làm việc như Senior Full-Stack Engineer, SQL Server Engineer, Security Engineer và Test Engineer trong repository GymFit.

# STATE

Tôi chỉ tiếp nhận **phần chức năng dành cho vai trò Coach**.

Đây là một lát cắt Coach-only, không phải toàn bộ TASK-008.

Mục tiêu:

- Coach quản lý chương trình tập của mình.
- Coach xem danh sách Member được phân công.
- Coach gán chương trình và lịch tập cho Member trong scope.
- Coach xem lịch sử buổi tập và tiến độ của Member trong scope.
- Coach sử dụng Dashboard riêng.
- Backend bảo vệ ownership và Coach–Member scope.

## Phần không thuộc prompt này

Không triển khai:

- Admin Exercise management.
- Admin Workout management.
- Admin Dashboard.
- Member Dashboard.
- Member tự bắt đầu Workout Session.
- Member tự ghi Set Logs.
- Member tự xem Progress.
- Video Library.
- Video playback.
- Membership/video entitlement.
- Marketplace.
- Seller.
- Payment, refund, settlement.
- AI recommendation.
- Camera hoặc pose estimation.
- Automatic rep counting.
- Nutrition.
- Medical diagnosis.
- Wearables.
- Live video coaching.

Nếu một chức năng Coach cần dữ liệu Member tạo ra nhưng hệ thống chưa có, chỉ:

- Tạo read-only empty state.
- Ghi `BLOCKED_BY_MEMBER_WORKOUT_FLOW`.
- Không tự triển khai Member flow trong task Coach.

Baseline:

```text
Base branch: seller_role_add
Base commit: 54015ae9638ec9f722e171c01a0ca69533ba907d
Canonical DB: GYMFIT_DB
Migration 0006: Auth/RBAC
Coach migration: 0007 hoặc số khả dụng tiếp theo sau khi kiểm tra ledger
```

Trước khi code phải đọc:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
docs/README.md
docs/TASK-008_IMPLEMENTATION_SPEC.md
docs/TASK-008_DISCOVERY_CHECKLIST.md
docs/DATABASE_AND_MIGRATIONS.md
docs/API_AND_AUTHORIZATION.md
docs/ARCHITECTURE.md
docs/KNOWN_LIMITATIONS.md
```

# TAILOR

## 1. Discovery Gate

Audit chỉ các phần liên quan trực tiếp Coach:

- Coach role và user model.
- Coach Dashboard hiện có.
- Coach routes hiện có.
- Coach–Member relationship hiện có.
- CRM/member scope hiện có.
- Exercise read API hiện có.
- Workout Program model/page/service hiện có.
- Assignment/Schedule model hiện có.
- Member progress/session read APIs hiện có.
- Frontend access policy.
- Sidebar/navigation cho Coach.
- Central validation và error handling.
- Migration ledger.

Kiểm tra tối thiểu:

```text
frontend/src/pages/coaches/CoachDashboard.tsx
frontend/src/pages/exercises/WorkoutPrograms.tsx
frontend/src/pages/exercises/ExerciseLibraryPage.tsx
frontend/src/services/exercises.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
backend/src/modules/coaches/**
backend/src/modules/exercises/**
backend/src/modules/crm/**
```

Nếu đường dẫn khác, tự tìm module tương đương.

Phân loại:

```text
REUSE
EXTEND
REPLACE
DEPRECATED
OUT_OF_SCOPE
```

Tạo:

```text
docs/coach/COACH_ROLE_DISCOVERY_REPORT.md
```

Không tạo migration trước:

```text
COACH_DISCOVERY_GATE_PASS
```

---

## 2. Coach Dashboard

Coach Dashboard chỉ hiển thị dữ liệu thuộc Coach hiện tại:

- Số Member đang được phân công.
- Danh sách Member active.
- Chương trình do Coach sở hữu.
- Assignment đang active.
- Lịch tập sắp tới của Member trong scope.
- Session gần đây nếu API đã có dữ liệu.
- Member cần theo dõi nếu có rule thật.
- Quick links:
  - My Programs.
  - My Members.
  - Assignments.
  - Schedules.
  - Member Progress.

Không:

- Tạo KPI giả.
- Hiển thị Member ngoài scope.
- Hiển thị dữ liệu Admin.
- Hiển thị Marketplace.
- Hiển thị Video Library.
- Hiển thị Member self-workout controls.

Route:

```text
/coach
```

---

## 3. Coach Exercise Read Library

Exercise Library trong task này chỉ là **read-only source** để Coach xây Program.

Coach được:

- Xem Exercise active.
- Search.
- Filter.
- Sort.
- Pagination.
- Xem chi tiết hướng dẫn dạng text.
- Chọn Exercise đưa vào Program.

Coach không được:

- Tạo Exercise global.
- Sửa Exercise global.
- Xóa/Deactivate Exercise global.
- Quản lý video Exercise.
- Quản lý package entitlement.

Nếu Backend hiện chưa có Coach read endpoint, có thể mở rộng tối thiểu trong module Exercise để trả active exercises cho Coach, nhưng:

- Không làm Admin CRUD.
- Không thay đổi global Exercise business rules.
- Không làm Video Library.

Routes đề xuất:

```text
/coach/exercises
/coach/exercises/:exerciseId
```

---

## 4. Coach-owned Workout Programs

Coach được:

- Xem danh sách Program của mình.
- Tạo Program.
- Xem chi tiết Program.
- Chỉnh sửa Program của mình.
- Activate/Deactivate Program của mình.
- Clone Program của mình nếu source hỗ trợ.
- Không hard delete Program đã có lịch sử.

Program:

```text
name
description
goal
difficulty
duration_weeks
days_per_week
owner_coach_id
is_active
created_at
updated_at
```

Rule:

- `owner_coach_id` lấy từ JWT, không nhận từ request body.
- Coach A không xem/sửa Program của Coach B.
- Program inactive không được assign mới.
- Numeric finite và bounded.
- Không mock data.

Routes:

```text
/coach/workout-programs
/coach/workout-programs/new
/coach/workout-programs/:programId
/coach/workout-programs/:programId/edit
```

---

## 5. Coach Program Builder

Coach quản lý cấu trúc Program của mình:

Program Day:

```text
program_id
week_number
day_number
title
description
sort_order
```

Program Exercise:

```text
program_day_id
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

Coach được:

- Add/remove/reorder Day.
- Add/remove/reorder Exercise.
- Chỉnh target.
- Chỉnh rest.
- Chỉnh note.
- Preview Program.

Rule:

- Chỉ Program thuộc Coach hiện tại.
- Exercise phải active.
- Có ít nhất target reps hoặc target duration.
- Reorder transactional.
- Không N+1.
- Không generic status PATCH.
- Không sửa Admin/Coach khác.

---

## 6. Coach–Member Scope

Ưu tiên tái sử dụng quan hệ hiện có.

Coach được:

- Xem Member đang được phân công cho mình.
- Xem chi tiết Member thuộc scope.
- Không xem Member ngoài scope.
- Không tự tạo/xóa relation nếu đây là quyền Admin.
- Nếu policy hiện tại cho phép Coach đề xuất relation, chỉ triển khai đúng policy hiện có.

Nếu chưa có model quan hệ, chỉ tạo model tối thiểu khi tài liệu và source xác nhận Coach cần ownership rõ ràng:

```text
coach_id
member_id
status
start_date
end_date
assigned_by
timestamps
```

Rule:

- Tối đa một ACTIVE relation cho cùng cặp.
- `coach_id` lấy từ JWT với Coach action.
- Cross-Coach IDOR phải trả concealed `404` hoặc policy hiện có.
- Booking không tự động cấp Coach scope.
- Member ngoài scope không xuất hiện trong count/list/detail.

Routes:

```text
/coach/members
/coach/members/:memberId
```

---

## 7. Coach Assignments

Coach được:

- Gán Program của mình cho Member thuộc scope.
- Xem Assignment của Member thuộc scope.
- Pause/Resume/Complete/Cancel theo state machine hiện có hoặc specification.
- Không gán Program của Coach khác.
- Không gán Member ngoài scope.

Assignment:

```text
member_id
program_id
coach_id
assigned_by
start_date
end_date
status
schedule_timezone
note
timestamps
```

Rule:

- `coach_id` và `assigned_by` lấy từ JWT/context.
- Member phải thuộc active scope.
- Program phải thuộc Coach hiện tại và active.
- Tối đa một primary ACTIVE Assignment mỗi Member nếu specification yêu cầu.
- Concurrency-safe.
- Timezone dùng IANA.
- Không cho Coach sửa lịch sử terminal tùy tiện.

Routes:

```text
/coach/assignments
/coach/assignments/new
/coach/assignments/:assignmentId
```

---

## 8. Coach Schedule Management

Coach được:

- Xem lịch tập của Member thuộc scope.
- Tạo/generate lịch từ Assignment nếu Backend hỗ trợ.
- Điều chỉnh lịch tương lai theo rule.
- Không sửa Schedule completed/in-progress.
- Không xem lịch Member ngoài scope.

Schedule status:

```text
SCHEDULED
IN_PROGRESS
COMPLETED
SKIPPED
CANCELLED
```

Generation:

- Deterministic.
- Idempotent.
- Không duplicate.
- Timezone-aware.
- Không ghi đè lịch sử.
- Có generation horizon hợp lý.

Routes:

```text
/coach/schedules
/coach/members/:memberId/schedule
```

---

## 9. Coach Read-only Session History

Coach chỉ được xem:

- Session của Member thuộc scope.
- Session status.
- Start/completed time.
- Duration.
- Exercise snapshot.
- Set summary nếu dữ liệu tồn tại.
- Member note nếu policy cho phép Coach xem.

Coach không được trong task này:

- Start Session thay Member.
- Log Set thay Member.
- Complete Session thay Member.
- Edit terminal Session.
- Xây Member Session UI.

Nếu API Session chưa tồn tại, không xây toàn bộ Member flow. Ghi:

```text
BLOCKED_BY_MEMBER_WORKOUT_FLOW
```

Route:

```text
/coach/members/:memberId/sessions
/coach/members/:memberId/sessions/:sessionId
```

---

## 10. Coach Read-only Member Progress

Coach được xem progress của Member active trong scope:

```text
completed_sessions
total_duration
training_volume
completion_rate
recent_sessions
exercise_history
```

Rule:

- Chỉ active-scoped Member.
- Không public.
- Không chẩn đoán sức khỏe.
- Không hiển thị dữ liệu ngoài phạm vi.
- Không tạo progress giả.
- Nếu Member flow chưa sinh dữ liệu, hiển thị empty state trung thực.
- Không triển khai Member Progress page trong task này.

Route:

```text
/coach/members/:memberId/progress
```

---

## 11. Coach Routes và Navigation

Chỉ đăng ký các route Coach:

```text
/coach
/coach/exercises
/coach/exercises/:exerciseId
/coach/workout-programs
/coach/workout-programs/new
/coach/workout-programs/:programId
/coach/workout-programs/:programId/edit
/coach/members
/coach/members/:memberId
/coach/assignments
/coach/assignments/new
/coach/assignments/:assignmentId
/coach/schedules
/coach/members/:memberId/schedule
/coach/members/:memberId/sessions
/coach/members/:memberId/sessions/:sessionId
/coach/members/:memberId/progress
```

Không thêm:

```text
/admin/**
/workouts/**
/progress/**
/videos
/video
```

Shared files chỉ sửa để thêm route/menu Coach:

```text
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
```

Không refactor role khác.

---

# EVALUATE

## 12. Security

Bắt buộc test:

- Guest không vào Coach route/API.
- Member không vào Coach route/API.
- Coach A không xem Member B ngoài scope.
- Coach A không xem/sửa Program Coach B.
- Coach A không xem Assignment Coach B.
- Coach A không xem Schedule/Session/Progress Member ngoài scope.
- Không nhận `coach_id`, `owner_coach_id`, `assigned_by` từ body.
- SQL parameterized.
- Pagination bounded.
- Sort/filter allowlist.
- Stored text an toàn.
- DTO không lộ dữ liệu private không cần thiết.

## 13. Concurrency

Test:

- Duplicate Program reorder.
- Duplicate active Assignment.
- Duplicate Schedule generation.
- Concurrent update cùng Assignment.
- Transaction rollback.

Không test hoặc triển khai concurrency Member Session/Set trong task Coach-only.

## 14. Database Safety

- Không drop `GYMFIT_DB`.
- Không sửa migration đã apply.
- Không sửa Marketplace migrations.
- Không sửa Video migrations/module.
- Dùng isolated DB:
  ```text
  GYMFIT_DB_COACH_ACCEPTANCE_<timestamp>
  ```
- Seed tối thiểu:
  - Coach A.
  - Coach B.
  - Member A thuộc Coach A.
  - Member B thuộc Coach B.
  - Exercises active.
  - Programs.
  - Assignment/Schedule nếu cần.
- Cleanup đầy đủ.
- Canonical DB không đổi.

## 15. Phần tuyệt đối không sửa

Video:

```text
frontend/src/pages/video/**
frontend/src/components/MediaPlayer.tsx
frontend/src/services/videos.ts
backend/src/modules/videos/**
```

Marketplace:

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

Admin/Member UI ngoài Coach:

```text
frontend/src/pages/admin/**
frontend/src/pages/dashboard/DashboardPage.tsx
frontend/src/pages/video/**
```

Không sửa các trang trên, trừ shared route registration không thể tránh và phải giữ nguyên hành vi role khác.

---

# PLAN

## C0 — Discovery

- Baseline.
- Build/typecheck.
- Migration status.
- Coach-only discovery report.
- Gate:
  ```text
  C0_COACH_DISCOVERY_PASS
  ```

## C1 — Coach Contracts

- Coach ownership.
- Coach–Member scope.
- Program/Assignment/Schedule contract.
- Read-only Session/Progress contract.
- Migration contract nếu cần.
- Gate:
  ```text
  C1_COACH_ARCHITECTURE_PASS
  ```

## C2 — Coach Exercise Read

- Active Exercise list/detail.
- Search/filter.
- Coach UI.
- Gate:
  ```text
  C2_COACH_EXERCISE_READ_PASS
  ```

## C3 — Coach Program Builder

- Program CRUD.
- Days.
- Exercises.
- Reorder.
- Ownership.
- Gate:
  ```text
  C3_COACH_PROGRAM_PASS
  ```

## C4 — Coach Members

- Scoped Member list/detail.
- IDOR.
- Gate:
  ```text
  C4_COACH_MEMBER_SCOPE_PASS
  ```

## C5 — Assignment và Schedule

- Assignment.
- Schedule.
- Timezone.
- Concurrency.
- Gate:
  ```text
  C5_COACH_ASSIGNMENT_PASS
  ```

## C6 — Session/Progress Read-only

- Scoped Session history.
- Scoped Progress.
- Truthful empty state.
- Không xây Member flow.
- Gate:
  ```text
  C6_COACH_MONITORING_PASS
  ```

## C7 — Dashboard, Routes và UI

- Coach Dashboard.
- Sidebar.
- Route guards.
- Responsive.
- Accessibility.
- Gate:
  ```text
  C7_COACH_UI_PASS
  ```

## C8 — Acceptance và Documentation

Browser matrix:

```text
Coach A
Coach B
Member A negative access
Guest negative access
Desktop
Mobile
Loading
Empty
Error
Out-of-scope resource
```

Regression:

- Login/refresh.
- Existing Coach Dashboard route.
- Booking/CRM read behavior nếu touched.
- Marketplace route reachability read-only.
- Video route reachability read-only.
- Frontend build.
- Backend build.
- Migration status.

Không sửa Marketplace, Video, Admin hoặc Member flow khi regression phát hiện lỗi không do Coach changes gây ra.

Verdict:

```text
FULL_COACH_ROLE_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

---

# Quy tắc Git

Branch:

```text
feat/vinh-coach-role-only
```

Không dùng:

```text
git reset --hard
git clean
git restore .
git checkout -- .
git add .
git add -A
git push --force
```

- Stage file cụ thể.
- Commit sau gate PASS.
- Không push tự động.
- Không tuyên bố PASS nếu chưa có evidence.

Commit đề xuất:

```text
chore(coach): establish coach-only contracts
feat(coach): add scoped exercise read
feat(coach): complete owned program builder
feat(coach): add scoped member management
feat(coach): add assignments and schedules
feat(coach): add scoped monitoring and progress
feat(coach): complete dashboard and navigation
docs(coach): finalize coach-only handover
```

---

# Báo cáo cuối

```text
FINAL VERDICT
BRANCH
START COMMIT
END COMMIT
MIGRATIONS
FILES CHANGED
COACH FEATURES COMPLETED
OUT_OF_SCOPE FILES VERIFIED UNCHANGED
TESTS RUN
BUILD RESULTS
SECURITY RESULTS
IDOR RESULTS
CONCURRENCY RESULTS
BROWSER RESULTS
DATABASE CLEANUP
CANONICAL DB INTEGRITY
BLOCKERS
REMAINING ISSUES
DOCUMENTATION UPDATED
NEXT ACTION
```

Không báo `FULL_COACH_ROLE_COMPLETE` nếu còn sửa hoặc triển khai Admin, Member, Video hoặc Marketplace ngoài phạm vi.
