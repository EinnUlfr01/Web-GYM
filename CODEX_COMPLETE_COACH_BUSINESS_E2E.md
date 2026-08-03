# CODEX MASTER PROMPT — COMPLETE COACH BUSINESS END-TO-END

Bạn là Codex đang làm việc như Senior Full-Stack Engineer, SQL Server Engineer, Security Engineer và Test Engineer trong repository GymFit.

# STATE

Coach Workspace đã hoàn thành trên branch:

```text
feat/vinh-coach-role-only
```

Commit hiện tại:

```text
BASE IMPLEMENTATION: 20b07bf
COACH TYPE FIX: 95ba829
COACH DOCUMENTATION FIX: 9d784e6
EXPECTED START COMMIT: 9d784e6
```

Trạng thái đã xác minh:

```text
Coach Workspace: PASS
Coach ownership/IDOR: PASS
Backend build: PASS
Frontend build: PASS
Migration 0007 acceptance DB: PASS
Migration 0007 canonical GYMFIT_DB: PENDING
Canonical checksum mismatch: 0
Member Workout Flow: NOT IMPLEMENTED
Coach Sessions/Set Logs/Progress mới: BLOCKED_BY_MEMBER_WORKOUT_FLOW
```

Mục tiêu của prompt này:

```text
Hoàn thành nghiệp vụ Coach end-to-end bằng cách:
1. Áp dụng migration 0007 an toàn vào canonical DB khi đủ điều kiện.
2. Xây Member Workout Flow tối thiểu nhưng đầy đủ.
3. Sinh Session, Snapshot, Set Logs và Progress thật.
4. Cho Coach xem dữ liệu thật từ Member.
5. Chạy full Coach–Member acceptance.
```

Không phát triển Admin Coach Management, Video Library hoặc Marketplace.

---

# PHẠM VI CHÍNH

## Được triển khai

```text
Member xem Workout Program được Coach gán
Member xem Workout Schedule
Member xem Today's Workout
Member Start Workout Session
Member xem Session Exercise Snapshot
Member ghi và sửa Set Logs khi Session IN_PROGRESS
Member Complete Session
Member Abandon Session
Member xem Session History
Member xem Progress cá nhân
Coach xem Session và Progress thật
Coach Dashboard bỏ blocker khi dữ liệu Member đã tồn tại
Coach–Member full end-to-end acceptance
```

## Không triển khai

```text
Admin Coach Management
Admin Exercise CRUD mới
Admin Workout Governance mới
Video Library
Video Player
Membership video entitlement
Marketplace
Seller
Payment
Refund
Settlement
AI recommendation
Camera
Pose estimation
Automatic rep counting
Nutrition
Medical diagnosis
Wearables
Live coaching
Social feed
```

---

# PHẦN TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA

## Marketplace của Nguyên

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

## Admin pages

```text
frontend/src/pages/admin/**
```

Không sửa Admin chỉ để tạo test data. Dùng acceptance fixtures trong isolated DB.

---

# PHASE 0 — BASELINE VÀ SAFETY CHECK

Trước khi sửa code:

1. Xác minh:
   ```bash
   git branch --show-current
   git rev-parse HEAD
   git status
   ```
2. Branch phải là:
   ```text
   feat/vinh-coach-role-only
   ```
3. HEAD dự kiến:
   ```text
   9d784e6
   ```
4. Working tree phải sạch hoặc chỉ có file được người dùng cho phép.
5. Chạy:
   ```bash
   cd backend
   npm run build
   npm run db:migrate:status
   ```
6. Chạy:
   ```bash
   cd frontend
   npx tsc --noEmit --pretty false
   npm run build
   ```
7. Ghi lại ba lỗi TypeScript cũ ngoài phạm vi nếu vẫn còn:
   ```text
   ProductCard.tsx
   ReviewsPage.tsx
   reviewsApi.ts
   ```
8. Không sửa ba lỗi trên trong task này.

Verdict:

```text
P0_BASELINE_PASS
```

Nếu branch/HEAD không đúng, dừng và báo `BLOCKED_WRONG_BASELINE`.

---

# PHASE 1 — MIGRATION 0007 CANONICAL APPLY GATE

Migration `0007` đã PASS trên acceptance DB. Không được sửa file `0007`.

## 1. Review

- Đọc migration `0007`.
- Xác minh checksum.
- Xác minh migration status:
  ```text
  18 applied
  1 pending
  0 checksum mismatch
  ```
- Xác minh connection target chính xác là `GYMFIT_DB`.
- Không dùng database khác theo suy đoán.

## 2. Backup bắt buộc

Trước khi apply:

- Tạo full backup của `GYMFIT_DB`.
- Tên backup có timestamp.
- Chạy `RESTORE VERIFYONLY`.
- Ghi đường dẫn backup trong report, không commit file backup.
- Nếu host không cho xóa backup, ghi rõ và không stage.

Nếu không thể backup hoặc verify:

```text
BLOCKED_CANONICAL_BACKUP
```

Không apply migration.

## 3. Apply

Chỉ apply bằng migration runner chuẩn của repository.

Không:

```text
sqlcmd chạy tay từng đoạn
edit migration
force checksum
drop database
reset database
```

Sau apply phải đạt:

```text
19 applied
0 pending
0 checksum mismatch
```

## 4. Smoke test ngay sau migration

- Backend start.
- Coach login.
- Coach Dashboard.
- Coach Programs.
- Coach Members.
- Coach Assignments.
- Coach Schedules.
- Không có SQL error.
- Không có route 500 mới.

Verdict:

```text
P1_MIGRATION_0007_APPLIED
```

Nếu canonical apply không được phép từ môi trường hiện tại:

- Không bypass.
- Ghi checklist manual.
- Tiếp tục code Member Flow trên isolated DB.
- Final verdict không được là full complete cho đến khi migration được apply thật.

---

# PHASE 2 — DISCOVERY MEMBER WORKOUT FLOW

Trước khi tạo migration mới:

Audit:

```text
backend/src/modules/coach-workspace/**
backend/src/modules/exercises/**
backend/src/modules/members/**
backend/src/modules/users/**
frontend/src/pages/dashboard/**
frontend/src/pages/exercises/**
frontend/src/services/coachWorkspaceApi.ts
frontend/src/types/coachWorkspace.ts
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
db/migrations/0007*
```

Tìm:

- Assignment schema.
- Schedule schema.
- Session schema.
- Session snapshot schema.
- Set log schema.
- Existing Member endpoints.
- Existing Coach read endpoints.
- Existing progress queries.
- Existing state machine.
- Existing timezone handling.
- Existing validation/error conventions.

Phân loại:

```text
REUSE
EXTEND
ADD
DEPRECATED
```

Tạo:

```text
docs/coach/MEMBER_WORKOUT_FLOW_DISCOVERY.md
```

Discovery phải xác nhận:

- `0007` đã tạo đủ schema hay chưa.
- Có cần migration `0008` không.
- Endpoint nào có thể tái sử dụng.
- DTO Member nào cần thêm.
- Frontend Member pages nào đã tồn tại.
- Không tạo model song song với Coach Workspace.

Verdict:

```text
P2_MEMBER_FLOW_DISCOVERY_PASS
```

---

# PHASE 3 — MEMBER WORKOUT API

Identity luôn lấy từ JWT.

Member không được truyền:

```text
member_id
user_id
coach_id
owner_id
```

để xác định actor.

## 1. Member Current Assignment

API:

```text
GET /api/member/workouts/current
```

Trả:

- Assignment active.
- Program.
- Coach summary tối thiểu.
- Start/end date.
- Timezone.
- Current status.
- Upcoming schedules.

Rule:

- Self-only.
- Không trả dữ liệu Member khác.
- Không trả internal Coach data.
- `404` hoặc empty contract theo convention hiện có.

## 2. Member Schedule

API:

```text
GET /api/member/workouts/schedules
GET /api/member/workouts/schedules/:scheduleId
```

Filter:

- Date range.
- Status.
- Pagination nếu cần.

Rule:

- Self-only.
- Schedule phải thuộc Assignment của Member.
- Out-of-scope trả concealed `404`.

## 3. Start Session

API named action:

```text
POST /api/member/workouts/schedules/:scheduleId/start
```

Không dùng generic status PATCH.

Transaction:

1. Lấy Member từ JWT.
2. Lock Schedule.
3. Lock Assignment.
4. Kiểm tra Schedule thuộc Member.
5. Kiểm tra Assignment ACTIVE.
6. Kiểm tra Schedule `SCHEDULED`.
7. Kiểm tra ngày hợp lệ theo timezone policy.
8. Enforce tối đa một Session `IN_PROGRESS`.
9. Tạo Session.
10. Tạo Session Exercise Snapshot từ Program Day.
11. Cập nhật Schedule `IN_PROGRESS`.
12. Commit.

Conflict:

```text
409
```

Không tạo duplicate khi hai request đồng thời.

## 4. Session Detail

API:

```text
GET /api/member/workouts/sessions
GET /api/member/workouts/sessions/:sessionId
```

Trả:

- Session.
- Snapshot exercises.
- Existing Set Logs.
- Targets.
- Duration.
- State.
- Coach note chỉ nếu member-visible.

Self-only.

## 5. Complete Session

API:

```text
POST /api/member/workouts/sessions/:sessionId/complete
```

Transaction:

- Session phải `IN_PROGRESS`.
- Member phải sở hữu Session.
- Validate dữ liệu Set.
- Tính `total_duration_seconds`.
- Chuyển Session `COMPLETED`.
- Chuyển Schedule `COMPLETED`.
- Terminal state immutable.

Double complete:

```text
409
```

## 6. Abandon Session

API:

```text
POST /api/member/workouts/sessions/:sessionId/abandon
```

Rule:

- Chỉ từ `IN_PROGRESS`.
- Session → `ABANDONED`.
- Schedule status theo contract đã chốt.
- Không tính vào completed progress.
- Terminal immutable.

## 7. Cancel Scheduled Workout

Chỉ nếu business rule trong `0007` và docs cho phép:

```text
POST /api/member/workouts/schedules/:scheduleId/cancel
```

Không tự thêm action nếu specification không hỗ trợ.

---

# PHASE 4 — SET LOG API

Endpoints named resource:

```text
POST   /api/member/workouts/sessions/:sessionId/exercises/:sessionExerciseId/sets
PATCH  /api/member/workouts/sessions/:sessionId/exercises/:sessionExerciseId/sets/:setId
DELETE /api/member/workouts/sessions/:sessionId/exercises/:sessionExerciseId/sets/:setId
```

DELETE chỉ cho phép nếu Session vẫn `IN_PROGRESS` và policy cho phép.

Fields:

```text
set_number
reps
weight_kg
duration_seconds
distance_meters
completed
note
```

Validation:

- `set_number` integer > 0.
- `reps` integer >= 0.
- `weight_kg` finite >= 0.
- `duration_seconds` integer >= 0.
- `distance_meters` finite >= 0.
- Note bounded.
- Ít nhất một metric có ý nghĩa nếu Set completed.

Rule:

- Self-only.
- Session phải `IN_PROGRESS`.
- Session Exercise phải thuộc Session.
- Set phải thuộc Session Exercise.
- Unique `(session_exercise_id, set_number)`.
- Không đổi `session_exercise_id`.
- Không sửa terminal Session.
- Duplicate race trả `409`.
- SQL parameterized.
- Transaction khi cần.

---

# PHASE 5 — SESSION SNAPSHOT INTEGRITY

Snapshot phải được tạo lúc Start Session.

Lưu tối thiểu:

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

Rule:

- Program thay đổi sau Start không làm đổi Snapshot.
- Exercise rename/deactivate không làm đổi lịch sử.
- Không join ngược live Program để render lịch sử thay Snapshot.
- Không cho Member chỉnh Snapshot.
- Coach chỉ đọc Snapshot của scoped Member.
- Admin không thuộc task này.

Test:

1. Start Session.
2. Sửa Program template trong isolated test.
3. Đọc Session lại.
4. Snapshot phải giữ nguyên.

---

# PHASE 6 — MEMBER FRONTEND

Tạo hoặc hoàn thiện các route:

```text
/workouts
/workouts/program
/workouts/schedule
/workouts/sessions
/workouts/sessions/:sessionId
/progress
/progress/sessions
/progress/exercises/:exerciseId
```

## 1. `/workouts`

Hiển thị:

- Today's Workout.
- Current Program.
- Coach.
- Upcoming Schedule.
- Continue active Session.
- Empty state nếu chưa có Assignment.
- Loading/error/retry.

## 2. Program

- Xem Program được gán.
- Xem các ngày tập.
- Xem bài tập và targets.
- Read-only.
- Không sửa template.

## 3. Schedule

- List/calendar đơn giản.
- Status badge.
- Start CTA khi hợp lệ.
- Không tự đoán state.
- Disable theo Backend response.

## 4. Session Detail

Mobile-first:

- Session state.
- Snapshot exercises.
- Targets.
- Set rows.
- Add/Edit/Delete Set.
- Complete.
- Abandon.
- Validation inline.
- Loading/disabled.
- Giữ form data khi API lỗi.
- Không camera.
- Không video.
- Không auto rep counting.

## 5. Session History

- Completed.
- Abandoned.
- Duration.
- Exercise summary.
- Pagination.
- Empty/error state.

## 6. Member Progress

- Completed sessions.
- Total duration.
- Training volume.
- Completion rate.
- Recent sessions.
- Exercise history.
- Weekly/monthly filter nếu API hỗ trợ.
- Không chẩn đoán sức khỏe.

## 7. Member Dashboard

Chỉ thêm widget liên quan Workout:

- Today's Workout.
- Continue Session.
- Upcoming Schedule.
- Progress summary.

Không redesign Dashboard khác.

---

# PHASE 7 — PROGRESS DATA END-TO-END

Công thức:

```text
completed_sessions
= count Session status COMPLETED

total_duration
= sum duration of COMPLETED Sessions

training_volume
= sum reps * weight_kg
  của completed sets
  thuộc COMPLETED Sessions

completion_rate
= completed due schedules / all due schedules * 100
```

Loại:

- Future schedules.
- Cancelled.
- Abandoned.
- Incomplete Set.
- Invalid numeric.
- Dữ liệu ngoài date range.

Rule:

- UTC storage.
- IANA timezone grouping.
- Không server timezone.
- Không NaN/Infinity.
- Member self-only.
- Coach active-scope only.
- Không public endpoint.

Sau khi Member complete Session:

- Member Progress cập nhật.
- Coach Progress view cập nhật.
- Coach Dashboard summary cập nhật.
- Không cần mock hoặc manual seed trong production.

---

# PHASE 8 — COACH INTEGRATION VALIDATION

Không xây lại Coach Workspace.

Chỉ sửa Coach nếu cần để consume dữ liệu Member thật:

- Remove `BLOCKED_BY_MEMBER_WORKOUT_FLOW` khi API có dữ liệu.
- Session list/detail hiển thị Snapshot và Set summary thật.
- Progress hiển thị computed metrics thật.
- Dashboard hiển thị recent sessions thật.
- Empty state vẫn đúng khi chưa có dữ liệu.
- Không mở quyền Coach ngoài scope.
- Không đổi Program ownership.

Mọi thay đổi Coach phải nhỏ và backward-compatible.

---

# PHASE 9 — SECURITY, IDOR VÀ CONCURRENCY

Actor matrix:

```text
Coach A
Coach B
Member A thuộc Coach A
Member B thuộc Coach B
Guest
```

Test bắt buộc:

## Member

- Member A không xem Assignment của Member B.
- Member A không xem Schedule của Member B.
- Member A không start Schedule của Member B.
- Member A không xem Session của Member B.
- Member A không ghi Set vào Session của Member B.
- Member A không sửa Set của Member B.
- Member A không xem Progress của Member B.

## Coach

- Coach A không xem Session của Member B.
- Coach A không xem Progress của Member B.
- Coach A không sửa Program Coach B.
- Coach A không assign Member B.

## Guest

- Không truy cập Member workout API.
- Không truy cập Coach API.

## Concurrency

- Hai Start cùng Schedule.
- Start hai Schedule khác nhau đồng thời cho một Member.
- Duplicate Set number.
- Hai Complete đồng thời.
- Complete và Abandon đồng thời.
- Program edit sau Start không đổi Snapshot.

Expected:

```text
401
403 hoặc concealed 404 theo policy
409 cho conflict
422 cho validation
```

---

# PHASE 10 — DATABASE VÀ ACCEPTANCE

Dùng isolated DB:

```text
GYMFIT_DB_COACH_E2E_ACCEPTANCE_<timestamp>
```

Lifecycle:

1. Create/restore isolated DB.
2. Verify exact DB name.
3. Apply full migration chain.
4. Seed deterministic actors.
5. Seed Coach–Member relation.
6. Seed Program/Assignment/Schedule.
7. Run API acceptance.
8. Run concurrency.
9. Run browser.
10. Cleanup fixtures.
11. Drop isolated DB.
12. Verify absent.
13. Verify canonical DB unchanged ngoài migration `0007` đã được apply có kiểm soát.

Không seed acceptance data vào canonical DB.

---

# PHASE 11 — BUILD VÀ REGRESSION

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

Project-wide TypeScript:

- Không được có lỗi mới.
- Ba lỗi cũ ngoài scope có thể còn:
  ```text
  ProductCard.tsx
  ReviewsPage.tsx
  reviewsApi.ts
  ```
- Ghi rõ `PRE_EXISTING_OUT_OF_SCOPE_TYPESCRIPT_ERRORS`.
- Không sửa trong task này.

Focused browser:

- Member mobile 375px.
- Member tablet 768px.
- Coach desktop.
- Coach mobile.
- No console errors.
- No horizontal overflow.
- Loading/empty/error.
- Keyboard/focus.
- Confirm dialogs.

Regression read-only:

- Auth.
- Existing Coach Workspace.
- Booking.
- Public Exercise.
- Marketplace route reachability.
- Không sửa lỗi không do task này gây ra.

---

# PHASE 12 — DOCUMENTATION

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
```

Tạo:

```text
docs/coach/COACH_END_TO_END_HANDOVER.md
```

Handover phải ghi:

- Branch.
- Start commit.
- End commit.
- Migration status.
- Member routes.
- Coach routes.
- API endpoints.
- State machines.
- Security.
- IDOR.
- Concurrency.
- Browser matrix.
- Build.
- Database cleanup.
- Known limitations.
- Files changed.
- Final verdict.

Không ghi PASS nếu chưa chạy thật.

---

# GIT STRATEGY

Tạo branch mới từ Coach branch hiện tại:

```bash
git checkout feat/vinh-coach-role-only
git pull --ff-only
git checkout -b feat/vinh-coach-member-e2e
```

Nếu branch Coach chưa push và `git pull` không dùng được:

- Không push.
- Tạo branch local từ current clean HEAD:
  ```bash
  git checkout -b feat/vinh-coach-member-e2e
  ```

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
chore(coach-e2e): establish member workout contracts
feat(coach-e2e): add member assignment and schedule views
feat(coach-e2e): add member workout session flow
feat(coach-e2e): add workout set logging
feat(coach-e2e): connect member and coach progress
test(coach-e2e): add security and concurrency acceptance
docs(coach-e2e): finalize end-to-end handover
```

Không push tự động.

---

# FINAL VERDICT

Chỉ dùng:

```text
FULL_COACH_BUSINESS_E2E_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

`FULL_COACH_BUSINESS_E2E_COMPLETE` chỉ khi:

- Migration `0007` đã apply canonical an toàn.
- Member xem Assignment/Schedule.
- Member Start Session.
- Snapshot đúng.
- Member ghi Set.
- Member Complete/Abandon.
- Progress tính đúng.
- Coach xem Session/Progress thật.
- IDOR PASS.
- Concurrency PASS.
- Backend build PASS.
- Frontend build PASS.
- Browser Member/Coach PASS.
- Acceptance DB cleanup.
- Canonical DB integrity.
- Không sửa Admin, Video, Marketplace.
- Documentation đầy đủ.

---

# BÁO CÁO CUỐI BẮT BUỘC

```text
FINAL VERDICT
BRANCH
START COMMIT
END COMMIT
MIGRATION 0007 CANONICAL STATUS
NEW MIGRATIONS
FILES CHANGED
MEMBER FEATURES
COACH INTEGRATION
API ENDPOINTS
STATE MACHINE RESULTS
SNAPSHOT INTEGRITY
PROGRESS FORMULA RESULTS
SECURITY RESULTS
IDOR RESULTS
CONCURRENCY RESULTS
BACKEND BUILD
FRONTEND TYPESCRIPT
FRONTEND BUILD
BROWSER RESULTS
DATABASE CLEANUP
CANONICAL DB INTEGRITY
OUT-OF-SCOPE FILES CHANGED
PRE_EXISTING ERRORS
BLOCKERS
REMAINING ISSUES
DOCUMENTATION UPDATED
NEXT ACTION
```
