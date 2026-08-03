# CODEX PROMPT — COMPLETE ADMIN COACH MANAGEMENT FOR TASK-008

## 1. MỤC TIÊU

Hoàn thiện phần còn thiếu để module Coach của GymFit đạt mức:

```text
FULL_COACH_MODULE_COMPLETE
```

Phần Coach Workspace và Member Workout E2E đã hoàn thành. Lượt này chỉ bổ sung lớp quản trị Admin cần thiết:

```text
Admin Coach Management
Admin Exercise Library
Admin Workout Governance
Admin–Coach–Member authorization
Admin–Coach–Member acceptance
```

Không mở rộng sang các chức năng nâng cao hoặc nghiệp vụ ngoài TASK-008.

---

# 2. BASELINE BẮT BUỘC

Repository:

```text
D:\Web-GYM-seller-latest
```

Branch nguồn:

```text
fix/vinh-coach-e2e-hardening
```

Commit dự kiến:

```text
90140f5
```

Tạo branch mới:

```text
feat/vinh-admin-coach-management
```

Trước khi sửa:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git log --oneline -5
```

Điều kiện:

```text
Branch nguồn đúng
HEAD đúng hoặc đã được audit rõ
Working tree không có file lạ được stage
```

Nếu HEAD khác:

- Không reset.
- Không xóa thay đổi.
- Audit diff trước.
- Chỉ tiếp tục khi baseline vẫn chứa đầy đủ Coach E2E đã hoàn thành.

---

# 3. TRẠNG THÁI HIỆN TẠI

Đã có:

```text
Coach Dashboard
Coach Exercise Library read-only
Coach Program Builder
Coach–Member scope
Assignment
Schedule
Member Workout Flow
Session Snapshot
Set Logs CRUD
Member Progress
Coach đọc Session và Progress
Timezone IANA
Coach reassignment domain service
IDOR
Concurrency
Migration 0007
Migration 0008
```

Chưa có đầy đủ:

```text
Trang Admin quản lý Coach riêng
Admin Exercise CRUD
Admin xem toàn bộ Workout data
Admin gọi reassignment service qua luồng chính thức
Admin routes và authorization hoàn chỉnh cho TASK-008
Admin–Coach–Member acceptance đầy đủ
```

---

# 4. NGUYÊN TẮC AN TOÀN

## 4.1 Không làm lại phần đã hoàn thành

Không rewrite:

```text
Coach Workspace
Member Workout Flow
Session state machine
Set Log state machine
Progress formula
Snapshot logic
Timezone helper
Coach reassignment service
```

Chỉ tái sử dụng và tích hợp.

## 4.2 Không mở rộng quá mức

Không làm:

```text
Coach payroll
Coach commission
Coach performance ranking
AI workout generation
Automatic coach assignment
Chat
Notification system phức tạp
Live coaching
Camera
Pose estimation
Automatic rep counting
Medical data
Nutrition
Wearables
Video entitlement
Booking tự động tạo Coach–Member relation
```

## 4.3 Không hard delete

Không hard delete:

```text
Coach
Exercise đã được sử dụng
Program
Assignment
Session
Set Log
Progress history
```

Dùng:

```text
ACTIVE
INACTIVE
SUSPENDED
DEACTIVATED
PAUSED
CANCELLED
```

theo state hiện có.

---

# 5. PHẠM VI ĐƯỢC SỬA

## Backend

```text
backend/src/modules/admin-coaches/**
backend/src/modules/coach-workspace/**
backend/src/modules/member-workouts/**
backend/src/modules/exercises/**
backend/src/modules/users/**
backend/src/modules/members/**
backend/src/shared/**
```

Chỉ sửa module hiện có khi cần tích hợp Admin.

## Frontend

```text
frontend/src/pages/admin/coaches/**
frontend/src/pages/admin/exercises/**
frontend/src/pages/admin/workouts/**
frontend/src/components/admin/coaches/**
frontend/src/components/admin/exercises/**
frontend/src/components/admin/workouts/**
frontend/src/services/adminCoachApi.ts
frontend/src/services/adminExerciseApi.ts
frontend/src/services/adminWorkoutApi.ts
frontend/src/types/adminCoach.ts
frontend/src/types/adminExercise.ts
frontend/src/types/adminWorkout.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
frontend/src/components/layout/Layout.tsx
```

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
docs/admin/**
```

---

# 6. PHẦN TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA

## Marketplace Backend

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

## Các lỗi TypeScript cũ ngoài phạm vi

Không sửa trong task này:

```text
frontend/src/components/products/ProductCard.tsx
frontend/src/pages/reviews/ReviewsPage.tsx
frontend/src/services/reviewsApi.ts
```

Ghi:

```text
PRE_EXISTING_OUT_OF_SCOPE_TYPESCRIPT_ERRORS
```

Không dùng ba lỗi này để mở rộng phạm vi.

---

# 7. KIẾN TRÚC ADMIN COACH MANAGEMENT

## 7.1 Trang riêng

Tạo:

```text
/admin/coaches
/admin/coaches/:coachId
```

Không nhét toàn bộ quản trị Coach vào Admin Dashboard.

## 7.2 Admin Dashboard chỉ hiển thị tổng quan

Chỉ thêm các thẻ nhẹ:

```text
Tổng số Coach
Coach đang hoạt động
Coach bị suspend
Member chưa có Coach
Assignment sắp hết hạn
Session hoàn thành tuần này
```

Mỗi thẻ dẫn đến:

```text
/admin/coaches
```

Không thêm bảng quản lý lớn vào Dashboard.

## 7.3 Coach Detail dùng tab

```text
Tổng quan
Hội viên
Chương trình
Buổi tập
Tiến độ
```

Không tạo quá nhiều route con nếu tab có thể xử lý rõ ràng.

---

# 8. PHASE 1 — ADMIN COACH LIST

Route:

```text
GET /api/admin/coaches
```

Frontend:

```text
/admin/coaches
```

Chức năng:

- Danh sách Coach.
- Search theo tên/email.
- Filter:
  ```text
  ACTIVE
  SUSPENDED
  INACTIVE
  ```
- Pagination.
- Số Member đang quản lý.
- Số Program.
- Số Session gần đây.
- Trạng thái tài khoản.
- Nút xem chi tiết.

Không trả secret hoặc internal auth data.

Acceptance:

- Admin truy cập được.
- Coach không truy cập được.
- Member không truy cập được.
- Guest nhận `401`.
- Search/filter/pagination đúng.

Verdict:

```text
P1_ADMIN_COACH_LIST_PASS
```

---

# 9. PHASE 2 — ADMIN COACH DETAIL

Route:

```text
GET /api/admin/coaches/:coachId
```

Hiển thị:

```text
Họ tên
Email
Chuyên môn
Kinh nghiệm
Trạng thái
Ngày tạo
Số Member
Số Program
Số Session gần đây
```

Không hiển thị:

```text
password hash
refresh token
session token
mail credential
JWT secret
```

Nếu Coach không tồn tại:

```text
404
```

Verdict:

```text
P2_ADMIN_COACH_DETAIL_PASS
```

---

# 10. PHASE 3 — COACH STATUS MANAGEMENT

API:

```text
PATCH /api/admin/coaches/:coachId/status
```

Payload:

```json
{
  "status": "ACTIVE | SUSPENDED | INACTIVE",
  "reason": "optional bounded text"
}
```

Quy tắc:

- Chỉ Admin.
- Không hard delete.
- Không cho Coach tự sửa trạng thái.
- Suspended Coach không được truy cập Coach Workspace.
- Lịch sử Program, Assignment, Session và Progress được giữ nguyên.
- Không tự xóa Assignment khi suspend.
- Có audit log nếu dự án đã có cơ chế audit.
- Không tạo hệ thống audit mới phức tạp nếu chưa có.

Concurrency:

- Hai request status cùng lúc phải deterministic.
- Không để trạng thái ngoài enum.

Verdict:

```text
P3_COACH_STATUS_PASS
```

---

# 11. PHASE 4 — ADMIN COACH–MEMBER MANAGEMENT

Trong tab:

```text
/admin/coaches/:coachId
→ Hội viên
```

API tối thiểu:

```text
GET  /api/admin/coaches/:coachId/members
GET  /api/admin/coach-members/unassigned
POST /api/admin/coaches/:coachId/members/:memberId/assign
POST /api/admin/coaches/:coachId/members/:memberId/reassign
```

## Assign

Chỉ cho Member chưa có Coach active.

Transaction:

1. Lock Member.
2. Kiểm tra Coach active.
3. Kiểm tra Member chưa có scope active.
4. Tạo Coach–Member relation.
5. Commit.

## Reassign

Phải tái sử dụng Coach reassignment service đã có.

Transaction:

```text
Lock Member
→ Lock scope cũ
→ Lock Assignment cũ
→ Pause hoặc Cancel Assignment cũ theo policy hiện có
→ Giữ nguyên Session history
→ Đóng scope Coach cũ
→ Tạo scope Coach mới
→ Commit
```

Không:

```text
chuyển ownership Program
xóa Session cũ
xóa Progress cũ
tự tạo Assignment mới
tự gán Program của Coach cũ cho Coach mới
```

Coach mới sẽ tự tạo Assignment mới khi cần.

Acceptance:

- Gán Member chưa có Coach.
- Không gán trùng.
- Reassign Coach A → Coach B.
- Assignment cũ được pause/cancel đúng policy.
- Session history không mất.
- Coach A không xem dữ liệu mới.
- Coach B xem được Member sau reassignment.
- Hai reassignment đồng thời không tạo hai scope active.

Verdict:

```text
P4_ADMIN_COACH_MEMBER_PASS
```

---

# 12. PHASE 5 — ADMIN EXERCISE LIBRARY

Route frontend:

```text
/admin/exercises
```

API:

```text
GET    /api/admin/exercises
POST   /api/admin/exercises
GET    /api/admin/exercises/:exerciseId
PATCH  /api/admin/exercises/:exerciseId
POST   /api/admin/exercises/:exerciseId/activate
POST   /api/admin/exercises/:exerciseId/deactivate
```

Chức năng:

- List.
- Search.
- Filter.
- Create.
- Edit.
- Activate.
- Deactivate.
- Pagination.

Fields chỉ dùng theo schema hiện có, ví dụ:

```text
name
description
muscle_group
equipment
difficulty
instructions
media_url
is_active
```

Không tạo field mới nếu schema không có và không cần thiết.

Quy tắc:

- Không hard delete Exercise đã được dùng.
- Coach chỉ đọc Exercise active.
- Session Snapshot cũ không thay đổi khi Exercise bị rename/deactivate.
- Validate URL nếu có.
- Text bounded.
- Search parameterized.

Verdict:

```text
P5_ADMIN_EXERCISE_LIBRARY_PASS
```

---

# 13. PHASE 6 — ADMIN WORKOUT GOVERNANCE

Tạo trang:

```text
/admin/workouts
```

Dùng tab:

```text
Programs
Assignments
Schedules
Sessions
Progress
```

Mục tiêu chính:

```text
Read-only governance
```

## Programs

Admin xem:

- Program.
- Coach owner.
- Trạng thái.
- Số Assignment.
- Ngày tạo/cập nhật.

Không sửa Program của Coach nếu chưa có rule rõ.

## Assignments

Admin xem:

- Member.
- Coach.
- Program.
- Start/end date.
- Timezone.
- Status.

Không thay Assignment bằng generic PATCH.

## Schedules

Admin xem:

- Member.
- Coach.
- Program.
- Scheduled date.
- Status.

## Sessions

Admin xem:

- Member.
- Coach.
- Program.
- Status.
- Duration.
- Snapshot summary.
- Set summary.

Admin không sửa:

```text
Session
Snapshot
Set Logs
```

## Progress

Admin xem:

- Completed sessions.
- Total duration.
- Training volume.
- Completion rate.

Filters:

```text
Coach
Member
Status
Date range
```

Authorization:

- Admin-only.
- Không public.
- Không phụ thuộc frontend guard.

Verdict:

```text
P6_ADMIN_WORKOUT_GOVERNANCE_PASS
```

---

# 14. ADMIN PROGRAM BUILDER — SAFE DECISION GATE

TASK-008 có thể yêu cầu Admin tạo Program.

Trước khi làm:

Audit schema và ownership model.

## Nếu schema đã hỗ trợ Admin-owned Program

Có thể mở lại Program Builder cho Admin bằng service hiện có.

Yêu cầu:

- Không phá Coach ownership.
- Admin-owned Program có owner type rõ ràng.
- Assignment authorization rõ.
- Acceptance đầy đủ.

## Nếu schema chỉ hỗ trợ Coach ownership

Không tự tạo ownership model mới trong task này.

Ghi:

```text
BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL
```

Giữ Admin ở chế độ:

```text
read-only governance
```

Không sửa schema lớn chỉ để đạt checklist.

---

# 15. PHASE 7 — ROUTES, SIDEBAR VÀ AUTHORIZATION

Sidebar Admin:

```text
Tổng quan
Quản lý Coach
Exercise Library
Workout Governance
```

Không tạo quá nhiều mục con.

Frontend routes:

```text
/admin/coaches
/admin/coaches/:coachId
/admin/exercises
/admin/workouts
```

Backend:

- Admin guard thật.
- Không chỉ dựa vào frontend role check.
- Coach/Member nhận `403` hoặc concealed `404` theo policy hiện có.
- Guest nhận `401`.

Không sửa Auth/JWT architecture.

Verdict:

```text
P7_ADMIN_AUTHORIZATION_PASS
```

---

# 16. PHASE 8 — FULL ADMIN–COACH–MEMBER ACCEPTANCE

Dùng database riêng:

```text
GYMFIT_DB_ADMIN_COACH_ACCEPTANCE_<timestamp>
```

Actors:

```text
Admin
Coach A
Coach B
Member A
Member B
Guest
```

Flow bắt buộc:

```text
Admin tạo hoặc activate Exercise
→ Coach A tạo Program
→ Admin gán Member A cho Coach A
→ Coach A tạo Assignment và Schedule
→ Member A Start Session
→ Member A ghi Set
→ Member A Complete Session
→ Coach A xem Progress
→ Admin xem Program/Assignment/Session/Progress
→ Admin reassign Member A sang Coach B
→ Assignment cũ được pause/cancel
→ Session history giữ nguyên
→ Coach A không xem dữ liệu mới
→ Coach B quản lý Member A
```

Negative tests:

- Coach truy cập Admin API.
- Member truy cập Admin API.
- Guest truy cập Admin API.
- Coach A xem Member B.
- Duplicate assign.
- Concurrent reassign.
- Suspend Coach rồi Coach đăng nhập/truy cập Workspace.
- Admin sửa Set Log phải bị từ chối vì không có action đó.

Browser:

```text
375px
768px
1440px
```

Kiểm tra:

- Không overflow.
- Không console error mới.
- Loading.
- Empty.
- Error.
- Retry.
- Keyboard/focus.
- Confirm dialogs.

Cleanup:

- Xóa fixture.
- Drop isolated DB.
- Verify absent.
- Canonical DB không có fixture acceptance.

Verdict:

```text
P8_ADMIN_COACH_ACCEPTANCE_PASS
```

---

# 17. PHASE 9 — BUILD VÀ QUALITY GATES

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

Yêu cầu:

- Không có lỗi mới thuộc Admin Coach/TASK-008.
- Ba lỗi cũ ngoài phạm vi được ghi rõ.
- Backend build PASS.
- Frontend Vite build PASS.
- `git diff --check` PASS.

Không báo project-wide TypeScript PASS nếu ba lỗi cũ còn tồn tại.

---

# 18. PHASE 10 — DOCUMENTATION

Cập nhật tài liệu canonical hiện có.

Không tạo hàng loạt README mới.

Cập nhật tối thiểu:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
docs/README.md
docs/ARCHITECTURE.md
docs/API_AND_AUTHORIZATION.md
docs/DATABASE_AND_MIGRATIONS.md
docs/KNOWN_LIMITATIONS.md
docs/coach/COACH_END_TO_END_HANDOVER.md
```

Tạo một handover mới:

```text
docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md
```

Nội dung:

```text
Branch
Start commit
End commit
Routes
APIs
Authorization
Coach status rules
Assign/reassign rules
Exercise rules
Governance rules
Acceptance matrix
Build
Database cleanup
Known limitations
Files changed
Final verdict
```

Không ghi commit hash chưa tồn tại.

---

# 19. REPOSITORY HYGIENE

Không commit:

```text
backend/.env
CODEX_*.md
CODEX_*.txt
TASK008_CODEX_APP_PACKAGE/
TASK008_CODEX_APP_PACKAGE.zip
*.bak
*.backup
acceptance artifacts
local logs
dist/
node_modules/
```

Không dùng:

```text
git add .
git add -A
git reset --hard
git clean
git push
git push --force
```

Stage từng file cụ thể.

Trước commit:

```bash
git status --short
git diff --check
git diff --cached --name-only
```

Không push tự động.

---

# 20. GIT COMMIT STRATEGY

Commit đề xuất:

```text
feat(admin-coach): add coach management APIs
feat(admin-coach): add coach management pages
feat(admin-coach): integrate safe member reassignment
feat(admin-exercise): add exercise library management
feat(admin-workout): add read-only workout governance
test(admin-coach): add admin coach acceptance coverage
docs(admin-coach): complete admin coach handover
```

---

# 21. FINAL VERDICT

Chỉ dùng:

```text
FULL_COACH_MODULE_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

Chỉ báo:

```text
FULL_COACH_MODULE_COMPLETE
```

khi:

- Coach Workspace vẫn PASS.
- Member Workout E2E vẫn PASS.
- Admin Coach list/detail PASS.
- Coach status management PASS.
- Assign/reassign PASS.
- Admin Exercise Library PASS.
- Admin Workout Governance PASS.
- Backend Admin authorization PASS.
- Admin–Coach–Member acceptance PASS.
- No regression Coach/Member.
- Build PASS.
- No new TypeScript errors.
- Acceptance DB cleanup.
- Canonical DB integrity.
- Không sửa Marketplace, Video hoặc Auth architecture.
- Không commit secret hoặc prompt/package tạm.

Nếu Admin Program Builder chưa làm vì schema không hỗ trợ, final report phải ghi:

```text
BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL
```

Nhưng không được tự ý thiết kế lại schema lớn.

---

# 22. BÁO CÁO CUỐI BẮT BUỘC

```text
FINAL VERDICT
BRANCH
START COMMIT
END COMMIT
CODE COMMITS
TEST COMMIT
DOCUMENTATION COMMIT
MIGRATIONS
FILES CHANGED
ADMIN COACH LIST
ADMIN COACH DETAIL
COACH STATUS MANAGEMENT
ASSIGN MEMBER
REASSIGN MEMBER
COACH SCOPE CONSISTENCY
ADMIN EXERCISE LIBRARY
ADMIN WORKOUT GOVERNANCE
ADMIN PROGRAM BUILDER DECISION
ADMIN ROUTES
BACKEND AUTHORIZATION
SECURITY RESULT
IDOR RESULT
CONCURRENCY RESULT
COACH REGRESSION
MEMBER WORKOUT REGRESSION
BACKEND BUILD
FRONTEND TYPESCRIPT
PRE_EXISTING OUT-OF-SCOPE ERRORS
FRONTEND BUILD
BROWSER RESULT
DATABASE CLEANUP
CANONICAL DB INTEGRITY
OUT-OF-SCOPE FILES CHANGED
REPOSITORY HYGIENE
DOCUMENTATION UPDATED
BLOCKERS
REMAINING ISSUES
NEXT ACTION
```

Không push tự động.
