# CODEX FINAL PROMPT — CLEANUP AND VERIFY `coach1`

## Mục tiêu

Hoàn tất bước cuối cho module Coach trên repository:

```text
https://github.com/EinnUlfr01/Web-GYM
```

Branch:

```text
coach1
```

Mục tiêu cuối:

```text
FULL_COACH_MODULE_COMPLETE
```

Không push tự động.

---

## Baseline đã xác minh

```text
IMPLEMENTATION COMMIT:
232df83e4dfc5766b65289e925f25cf8d4f6914d
feat: add admin coach management

VERIFICATION COMMIT:
4f4d7134e79db47570880e03fb65d956882cba96
fix(coach): finalize admin coach verification
```

Coach hiện đã có:

- Coach Workspace.
- Member Workout E2E.
- Admin Coach Management.
- Admin Exercise Library.
- Admin Workout Governance read-only.
- Migration `0007`, `0008`, `0009`.
- Admin RBAC.
- Assign/reassign Member.
- Session/Progress preservation.
- Backend acceptance.

Các việc còn phải xử lý:

1. Xóa prompt/package tạm đã commit nhầm.
2. Sửa handover ghi đúng commit.
3. Sửa comment stale trong reassignment service.
4. Chạy visual/browser verification thật.
5. Chạy lại build, lint, typecheck, acceptance.
6. Phân loại lỗi migration `0100` đúng là ngoài phạm vi Coach.

---

# 1. BASELINE VÀ GIT SAFETY

Chạy:

```bash
git checkout coach1
git branch --show-current
git rev-parse HEAD
git status --short
git log --oneline -10
git diff coach..coach1 --name-status
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

Nếu working tree có file người dùng chưa commit:

- Không xóa.
- Không stage.
- Không sửa nếu ngoài phạm vi.
- Ghi rõ trong final report.

---

# 2. XÓA PROMPT/PACKAGE TẠM KHỎI BRANCH

Xóa khỏi repository:

```text
COACH_FINAL_VERIFICATION_PROMPT_README.md
CODEX_COMPLETE_ADMIN_COACH_MANAGEMENT_TASK008.md
CODEX_COMPLETE_COACH_BUSINESS_E2E.md
CODEX_FIX_COACH_ROLE_ONLY.md
CODEX_FIX_COMPLETE_COACH_E2E_HARDENING.md
CODEX_FIX_COMPLETE_COACH_E2E_HARDENING_V2_DOC_CLEANUP.md
CODEX_PROMPT_COACH_ROLE_ONLY_FINAL.md
TASK008_CODEX_APP_PACKAGE.zip
TASK008_CODEX_APP_PACKAGE/**
```

Trước khi xóa:

```bash
git grep -n "TASK008_CODEX_APP_PACKAGE"
git grep -n "CODEX_COMPLETE_ADMIN_COACH_MANAGEMENT_TASK008"
git grep -n "COACH_FINAL_VERIFICATION_PROMPT_README"
```

Nếu tài liệu canonical đang link tới các file này:

- Gỡ link.
- Không thay bằng prompt khác.
- Không giữ prompt ở repository root.

Không xóa:

```text
README.md
ROADMAP.md
PROJECT_STATUS.md
docs/**
source code
migrations
acceptance scripts
```

Sau cleanup:

```bash
git status --short
git diff --name-status
```

---

# 3. SỬA HANDOVER

Mở:

```text
docs/admin/ADMIN_COACH_MANAGEMENT_HANDOVER.md
```

Xóa nội dung:

```text
End commit: no commit created
```

Handover phải ghi:

```text
IMPLEMENTATION COMMIT:
232df83e4dfc5766b65289e925f25cf8d4f6914d

VERIFICATION COMMIT:
4f4d7134e79db47570880e03fb65d956882cba96

FINAL CLEANUP COMMIT:
<hash sau khi commit cleanup>

BROWSER VERIFICATION COMMIT:
<hash nếu có>

DOCUMENTATION COMMIT:
<hash commit docs cuối>
```

Handover phải phân biệt:

```text
Coach module: PASS hoặc PARTIAL
Full project clean install: BLOCKED_BY_MARKETPLACE_MIGRATION_0100
Admin Program Builder: BLOCKED_ADMIN_PROGRAM_OWNERSHIP_MODEL
```

Không ghi:

```text
FULL_PROJECT_COMPLETE
```

---

# 4. SỬA COMMENT STALE

Mở:

```text
backend/src/modules/coach-workspace/coach-reassignment.service.ts
```

Comment hiện tại nói service không có Admin route là sai.

Thay bằng:

```ts
/**
 * Transactional Coach reassignment domain operation.
 * Used by the bounded Admin Coach Management route.
 * Historical sessions remain attached to the previous assignment.
 */
```

Không sửa logic service nếu acceptance đang PASS.

---

# 5. VISUAL/BROWSER VERIFICATION

## Chạy dự án

Backend:

```bash
cd backend
npm install
npm run build
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Xác minh:

```text
API: http://localhost:5000
Web: http://localhost:5173
```

## Thứ tự công cụ

Ưu tiên:

1. Browser plugin.
2. Playwright đã có trong repository.
3. Chromium/Chrome với Playwright cục bộ.
4. Manual browser checklist.

Nếu plugin thiếu `browser-client.mjs`:

```bash
npm ls playwright
npm ls @playwright/test
```

Không tự thêm framework automation lớn nếu repository chưa dùng.

## Routes phải kiểm tra

```text
/admin/coaches
/admin/coaches/:coachId
/admin/exercises
/admin/workouts
```

## Viewports

```text
375x812
768x1024
1440x900
```

## `/admin/coaches`

Kiểm tra:

- Loading.
- Empty.
- Error.
- Retry.
- Search.
- Filter trạng thái.
- Pagination.
- Status badge.
- Điều hướng Coach detail.
- Không tràn ngang.
- Không console error.

## Coach detail

Kiểm tra:

- Tổng quan.
- Hội viên.
- Chương trình.
- Buổi tập.
- Tiến độ.
- Assign Member.
- Reassign Member.
- Activate.
- Suspend.
- Confirm dialog.
- Form validation.
- API error.
- Keyboard focus.
- Modal close.
- Mobile layout.

## `/admin/exercises`

Kiểm tra:

- List.
- Search/filter.
- Create.
- Edit.
- Activate/deactivate.
- Validation.
- Không hard delete.
- Không console error.
- Mobile layout.

## `/admin/workouts`

Kiểm tra:

- Programs.
- Assignments.
- Schedules.
- Sessions.
- Progress.
- Filter.
- Pagination.
- Read-only.
- Không có action sửa Session/Set Log.
- Không console error.
- Mobile layout.

## Evidence

Tạo:

```text
docs/admin/ADMIN_COACH_BROWSER_VERIFICATION.md
```

Nội dung:

```text
Date
Branch
Commit
Browser
Viewport
Routes
Actions tested
Console result
Layout result
Failures
Fixes
Final browser verdict
```

Chỉ ghi:

```text
MANUAL_BROWSER_PASS
```

khi đã thực sự mở và kiểm tra.

Nếu không chạy được:

```text
BROWSER_VERIFICATION_BLOCKED
```

và ghi lý do thật.

---

# 6. BUILD, LINT VÀ TYPECHECK

Backend:

```bash
cd backend
npm run build
npm run lint
```

Frontend:

```bash
cd frontend
npx tsc --noEmit --pretty false
npm run build
```

Expected:

```text
Backend build PASS
Backend lint 0 errors
Frontend TypeScript 0 errors
Frontend build PASS
```

Warnings ghi rõ nhưng không sửa hàng loạt.

Chạy:

```bash
git diff --check
```

---

# 7. ADMIN COACH ACCEPTANCE

Chạy acceptance trên database riêng:

```text
GYMFIT_DB_ADMIN_COACH_ACCEPTANCE_<timestamp>
```

Guard:

```text
ADMIN_COACH_ACCEPTANCE=1
```

Phải test:

- Guest bị chặn.
- Coach bị chặn Admin API.
- Member bị chặn Admin API.
- Admin Exercise create/edit/status.
- Coach Program.
- Admin assign Member.
- Duplicate assign `409`.
- Member Start Session.
- Member ghi Set.
- Member Complete.
- Admin governance read.
- Coach IDOR.
- Admin không sửa Set Log.
- Concurrent reassign: một `200`, một `409`.
- Assignment cũ `PAUSED`.
- Session history giữ nguyên.
- Coach A mất scope.
- Coach B nhận scope.
- Suspend Coach.
- Suspended Coach không truy cập Workspace.

Cleanup:

```text
Xóa fixtures
Drop acceptance DB
Verify absent
Canonical DB không có fixture
```

---

# 8. MIGRATION VERIFICATION

Chạy:

```bash
cd backend
npm run db:migrate:status
```

Expected canonical:

```text
21 applied
0 pending
0 checksum mismatch
```

Phải xác minh:

```text
0007 applied
0008 applied
0009 applied
```

Không sửa:

```text
db/migrations/0100_*.sql đến 0111_*.sql
```

Phân loại đúng:

```text
COACH_MIGRATION_0001_TO_0009: PASS
FULL_PROJECT_CLEAN_INSTALL: BLOCKED_BY_MARKETPLACE_MIGRATION_0100
```

Tạo note:

```text
docs/marketplace/MIGRATION_0100_BASELINE_CONFLICT.md
```

Chỉ ghi:

- `SellerApplications already exists`.
- Cách tái hiện.
- Commit/database.
- Migration `0100`.
- Đây là ngoài phạm vi Coach.
- Đề xuất branch:
  ```text
  fix/marketplace-migration-0100
  ```

Không sửa migration `0100` trong task này.

---

# 9. PHẠM VI KHÔNG ĐƯỢC SỬA

Không sửa:

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
backend/src/modules/videos/**
frontend/src/pages/video/**
frontend/src/components/MediaPlayer.tsx
frontend/src/services/videos.ts
db/migrations/0100_*.sql đến 0111_*.sql
```

Không thay đổi:

```text
Auth architecture
JWT model
Marketplace business rules
SellerApplications schema
Payment
Refund
Settlement
Booking relation
```

---

# 10. COMMIT STRATEGY

Stage từng file cụ thể.

## Commit 1

```text
chore(coach): remove temporary prompt artifacts
```

Bao gồm:

- Xóa prompt/package tạm.
- Sửa comment stale.

## Commit 2 nếu browser phát hiện lỗi

```text
fix(admin-coach): resolve final browser verification issues
```

Chỉ tạo nếu có code fix thật.

## Commit 3

```text
test(admin-coach): record final browser and acceptance verification
```

## Commit 4

```text
docs(admin-coach): finalize coach module handover
```

Không push tự động.

---

# 11. FINAL VERDICT

Chỉ dùng:

```text
FULL_COACH_MODULE_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

## Chỉ báo `FULL_COACH_MODULE_COMPLETE` khi:

- Prompt/package tạm đã xóa.
- Handover commit đúng.
- Comment stale đã sửa.
- Backend build PASS.
- Backend lint 0 errors.
- Frontend TypeScript 0 errors.
- Frontend build PASS.
- Admin Coach acceptance PASS.
- Browser visual PASS thật.
- Migration `0007`–`0009` PASS.
- Acceptance DB cleanup PASS.
- Canonical DB fixture-free.
- Không sửa Marketplace/Video/Auth business logic.
- `git diff --check` PASS.
- Không commit secret.
- Không push tự động.

Lỗi migration `0100` không chặn Coach module, nhưng final report phải ghi:

```text
FULL_PROJECT_CLEAN_INSTALL_BLOCKED_BY_MARKETPLACE_MIGRATION_0100
```

---

# 12. FINAL REPORT

```text
FINAL VERDICT
REPOSITORY
BRANCH
START COMMIT
IMPLEMENTATION COMMIT
VERIFICATION COMMIT
CLEANUP COMMIT
BROWSER FIX COMMIT
TEST COMMIT
DOCUMENTATION COMMIT
END COMMIT
FILES REMOVED
FILES CHANGED
PROMPT ARTIFACT CLEANUP
HANDOVER METADATA
STALE COMMENT FIX
BACKEND BUILD
BACKEND LINT
FRONTEND TYPESCRIPT
FRONTEND BUILD
ADMIN COACH ACCEPTANCE
BROWSER METHOD
BROWSER VIEWPORTS
BROWSER ROUTES
BROWSER CONSOLE
BROWSER LAYOUT
MIGRATION 0007
MIGRATION 0008
MIGRATION 0009
CANONICAL DB STATUS
ACCEPTANCE DB CLEANUP
MIGRATION 0100 STATUS
OUT-OF-SCOPE FILES CHANGED
SECRETS CHECK
GIT DIFF CHECK
WORKTREE STATUS
REMAINING ISSUES
NEXT ACTION
```

Không push tự động.
