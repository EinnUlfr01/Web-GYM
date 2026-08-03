# CODEX FIX PROMPT — COACH ROLE ONLY

Bạn đang làm việc trong repository GymFit trên branch:

```text
feat/vinh-coach-role-only
```

Mục tiêu của lượt này chỉ là **sửa và xác minh phần Coach đã triển khai**, không phát triển thêm chức năng mới.

## STATE

Thông tin hiện tại:

```text
Base implementation commit: 20b07bf
Migration mới: 0007
Coach verdict hiện tại: PARTIALLY_COMPLETE
Blocker hợp lệ: BLOCKED_BY_MEMBER_WORKOUT_FLOW
```

Các vấn đề cần xử lý:

1. `CoachDashboard.tsx` đang sử dụng `session.member_name`, nhưng type `CoachSession` chưa khớp API contract.
2. `docs/coach/COACH_ROLE_HANDOVER.md` đang ghi commit cũ `9b006e5`, không khớp implementation hiện tại `20b07bf`.
3. Migration `0007` đã PASS trên acceptance DB nhưng còn pending trên canonical `GYMFIT_DB`.
4. Project-wide TypeScript hiện còn các lỗi cũ ngoài phạm vi Coach; không được sửa nhầm các file đó.

---

# PHẠM VI ĐƯỢC SỬA

Chỉ được sửa file thuộc Coach:

```text
backend/src/modules/coach-workspace/**
frontend/src/pages/coaches/**
frontend/src/services/coachWorkspaceApi.ts
frontend/src/types/coachWorkspace.ts
frontend/src/types/coach*.ts
frontend/src/components/coach/**
docs/coach/**
scripts hoặc acceptance test chỉ dành cho Coach
```

Shared file chỉ được sửa nếu thay đổi hiện tại của Coach gây lỗi trực tiếp:

```text
frontend/src/App.tsx
frontend/src/auth/accessPolicy.ts
frontend/src/components/layout/Sidebar.tsx
frontend/src/components/layout/Layout.tsx
```

Không refactor shared file ngoài phần Coach.

---

# PHẦN TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA

Không sửa:

```text
frontend/src/components/products/ProductCard.tsx
frontend/src/pages/reviews/ReviewsPage.tsx
frontend/src/services/reviewsApi.ts

frontend/src/pages/video/**
frontend/src/components/MediaPlayer.tsx
frontend/src/services/videos.ts
backend/src/modules/videos/**

frontend/src/pages/admin/**
frontend/src/pages/dashboard/**
frontend/src/pages/workouts/**
frontend/src/pages/progress/**

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

Không triển khai:

```text
Admin Coach Management
Member Workout Flow
Member Session Start/Complete
Member Set Logs
Member Progress Page
Video Library
Membership video access
Marketplace
Seller
Payment
Refund
Settlement
```

Nếu cần dữ liệu do Member tạo nhưng chưa có, giữ nguyên:

```text
BLOCKED_BY_MEMBER_WORKOUT_FLOW
```

---

# TASK 1 — SỬA TYPE COACHSESSION ĐÚNG CONTRACT

Kiểm tra đầy đủ:

```text
frontend/src/pages/coaches/CoachDashboard.tsx
frontend Coach types
coachWorkspaceApi response type
backend coach session DTO/query
```

Không sửa bằng cách đoán.

Thực hiện theo kết quả thực tế:

### Trường hợp Backend thật sự trả `member_name`

Cập nhật canonical frontend type đúng với response:

```ts
member_name: string;
```

Nếu Backend có thể trả null:

```ts
member_name: string | null;
```

UI phải có fallback an toàn:

```ts
session.member_name?.trim() || `Hội viên #${session.member_id}`
```

### Trường hợp Backend không trả `member_name`

Không thêm field giả vào type.

Thay UI bằng dữ liệu thật đã có hoặc fallback:

```ts
`Hội viên #${session.member_id}`
```

Không thêm API mới chỉ để sửa lỗi hiển thị này.

### Yêu cầu

- Type frontend phải khớp API contract thực tế.
- Không dùng `any`.
- Không dùng type assertion để che lỗi.
- Không thêm dữ liệu giả.
- Không sửa Member flow.

---

# TASK 2 — SỬA TÀI LIỆU HANDOVER

Mở:

```text
docs/coach/COACH_ROLE_HANDOVER.md
```

Sửa thông tin commit cũ:

```text
9b006e5
```

Không ghi một commit hash tự tham chiếu sai.

Cách ghi an toàn:

```text
BASE_IMPLEMENTATION_COMMIT: 20b07bf
FIX_VALIDATION_COMMIT: <hash commit sửa code sau khi tạo>
DOCUMENTATION_COMMIT: <hash docs commit nếu có>
```

Quy trình commit:

1. Sửa code/type.
2. Chạy validation.
3. Commit code với message:
   ```text
   fix(coach): align session type with dashboard contract
   ```
4. Lấy hash commit code vừa tạo.
5. Cập nhật handover với:
   ```text
   BASE_IMPLEMENTATION_COMMIT: 20b07bf
   FIX_VALIDATION_COMMIT: <hash commit code>
   ```
6. Commit tài liệu riêng:
   ```text
   docs(coach): correct implementation and validation commits
   ```

Trong handover phải ghi chính xác:

- Coach Workspace đã hoàn thành những gì.
- `BLOCKED_BY_MEMBER_WORKOUT_FLOW` còn tồn tại.
- Project-wide TypeScript còn lỗi cũ nào ngoài Coach.
- Migration `0007` đã PASS trên acceptance DB.
- Migration `0007` chưa được tự động apply vào canonical DB.
- Không tuyên bố `FULL_COMPLETE`.

---

# TASK 3 — XÁC MINH TYPESCRIPT VÀ BUILD

## Baseline TypeScript

Trước khi sửa, chạy:

```bash
cd frontend
npx tsc --noEmit --pretty false
```

Ghi lại toàn bộ lỗi.

Sau khi sửa, chạy lại cùng lệnh.

Điều kiện PASS của lượt fix:

- Không còn TypeScript error trong file Coach.
- Không xuất hiện error mới.
- Các lỗi cũ ngoài phạm vi Coach được ghi rõ nhưng không sửa.

Các lỗi ngoài phạm vi đã biết có thể nằm tại:

```text
frontend/src/components/products/ProductCard.tsx
frontend/src/pages/reviews/ReviewsPage.tsx
frontend/src/services/reviewsApi.ts
```

Nếu đúng là lỗi cũ, ghi:

```text
PRE_EXISTING_OUT_OF_SCOPE_TYPESCRIPT_ERRORS
```

Không được báo project-wide TypeScript PASS nếu vẫn còn các lỗi này.

## Build

Chạy:

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

Sau đó:

```bash
git diff --check
git status
```

Điều kiện:

- Backend build PASS.
- Frontend Vite build PASS.
- Không có lỗi Coach trong `tsc --noEmit`.
- Không có file ngoài phạm vi trong diff.
- Không có secret, backup, acceptance DB hoặc build artifact được stage.

---

# TASK 4 — XÁC MINH MIGRATION 0007

Chỉ kiểm tra trạng thái:

```bash
cd backend
npm run db:migrate:status
```

Xác nhận:

```text
0007 pending trên canonical DB
0 checksum mismatch
```

Không tự động apply migration `0007` vào `GYMFIT_DB` trong lượt fix này.

Không:

```text
drop database
reset database
force apply
edit migration 0007
change checksum
```

Nếu cần chuẩn bị hướng dẫn apply thật, chỉ ghi checklist:

1. Backup `GYMFIT_DB`.
2. Chạy `RESTORE VERIFYONLY`.
3. Kiểm tra đúng connection/database.
4. Review migration `0007`.
5. Apply bằng migration runner chuẩn.
6. Kiểm tra status.
7. Smoke test Coach.
8. Có rollback/recovery plan.

Không thực hiện bước apply nếu chưa có lệnh rõ ràng từ người dùng.

---

# TASK 5 — FOCUSED COACH REGRESSION

Chạy lại test Coach hiện có nếu repository hỗ trợ:

- Coach A đăng nhập được.
- Coach B đăng nhập được.
- Member không truy cập Coach route.
- Guest không truy cập Coach route.
- Coach A không xem Member của Coach B.
- Coach A không sửa Program của Coach B.
- Dashboard render session fallback đúng.
- Không có console error mới.
- Mobile Coach pages không vỡ layout.

Không tạo Session hoặc Set Log thay Member.

---

# GIT SAFETY

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

Chỉ stage đúng file Coach đã sửa.

Trước mỗi commit:

```bash
git status
git diff --check
git diff --cached --name-only
```

Nếu staged files có file ngoài phạm vi, unstage riêng file đó và dừng để kiểm tra.

---

# FINAL VERDICT

Chỉ dùng một trong các verdict:

```text
COACH_FIX_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

`COACH_FIX_COMPLETE` chỉ khi:

- Lỗi type Coach đã được sửa đúng API contract.
- Không còn TypeScript error trong file Coach.
- Backend build PASS.
- Frontend build PASS.
- Focused Coach regression PASS.
- Handover đã cập nhật đúng commit.
- Không sửa file ngoài phạm vi.
- Migration canonical vẫn chưa bị tự động apply.
- Blocker Member flow vẫn được ghi rõ.

---

# BÁO CÁO CUỐI BẮT BUỘC

Trả về:

```text
FINAL VERDICT
BRANCH
START COMMIT
CODE FIX COMMIT
DOCUMENTATION COMMIT
END COMMIT
FILES CHANGED
TYPE CONTRACT DECISION
TYPESCRIPT BASELINE
TYPESCRIPT AFTER FIX
PRE_EXISTING OUT-OF-SCOPE ERRORS
BACKEND BUILD
FRONTEND BUILD
COACH REGRESSION
MIGRATION 0007 STATUS
CANONICAL DB CHANGED: YES/NO
OUT-OF-SCOPE FILES CHANGED: YES/NO
BLOCKED_BY_MEMBER_WORKOUT_FLOW
REMAINING ISSUES
NEXT ACTION
```

Không push tự động.
