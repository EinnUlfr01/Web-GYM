# PROMPT NGOÀI — DÁN TRỰC TIẾP VÀO CODEX APP

Bạn đang làm việc trực tiếp trong repository GymFit.

Hãy thực hiện TASK-008 theo cơ chế đọc hiểu trước, triển khai sau. Không được bắt đầu code ngay khi chưa hoàn thành Discovery.

## Thứ tự bắt buộc

1. Đọc toàn bộ file `README_TASK008_PLAN.md`.
2. Đọc toàn bộ file `PROMPT_00_DISCOVERY.md`.
3. Thực hiện đầy đủ mọi yêu cầu trong `PROMPT_00_DISCOVERY.md`.
4. Chỉ được chuyển sang triển khai khi báo cáo Discovery có đúng trạng thái:

```text
DISCOVERY_GATE_PASS
```

5. Nếu Discovery chưa PASS hoặc còn blocker về database, migration, schema, ownership, authorization hay source hiện tại thì:
   - không tạo migration;
   - không code nghiệp vụ;
   - ghi rõ blocker, bằng chứng và bước xử lý an toàn;
   - không tự giả định để tiếp tục.

6. Khi Discovery đã PASS, đọc toàn bộ file `PROMPT_01_IMPLEMENTATION.md`.
7. Thực hiện lần lượt toàn bộ phase trong `PROMPT_01_IMPLEMENTATION.md`.
8. Không được bỏ qua phase hoặc chuyển phase khi gate trước chưa PASS.
9. Tự kiểm tra và sửa lỗi trong phạm vi TASK-008 trước khi sang phase tiếp theo.
10. Tiếp tục làm việc xuyên suốt cho đến khi đạt một trong ba kết quả:

```text
FULL_TASK_008_COMPLETE
PARTIALLY_COMPLETE
BLOCKED
```

## Quy tắc bắt buộc

- Chỉ làm nhóm A: Coach / TASK-008.
- Không làm phần B Marketplace Frontend.
- Không làm phần C ngoài phạm vi TASK-008.
- Không sửa Marketplace Backend hoặc Marketplace Database của Nguyên.
- Không sửa migration đã tồn tại hoặc đã được apply.
- Không sửa migration `0001–0006`.
- Không sửa migration Marketplace `0100–0111`.
- Không tạo một hệ thống Workout mới chạy song song với hệ thống cũ.
- Phải rà source và database hiện có để quyết định `REUSE`, `EXTEND`, `REPLACE` hoặc `DEPRECATED`.
- Backend là lớp bảo mật chính.
- Phải kiểm thử role, ownership, IDOR, concurrency, state transition và dữ liệu lịch sử.
- Session phải lưu snapshot để sửa Program sau này không làm thay đổi lịch sử.
- Không dùng dữ liệu thật để chạy acceptance test.
- Không chạy lệnh phá dữ liệu hoặc làm mất thay đổi hiện tại.
- Không dùng `git reset --hard`, `git clean`, hoặc ghi đè code ngoài phạm vi.
- Không tự push lên GitHub.
- Không ghi PASS cho nội dung chưa thật sự chạy và kiểm chứng.
- Không dùng mock data hoặc KPI giả trong giao diện hoàn chỉnh.
- Không hard-code API localhost nếu dự án đã có shared API client.
- Không dùng `window.alert()` hoặc `window.confirm()` cho giao diện hoàn chỉnh.
- Shared files như `App.tsx`, route, sidebar và layout chỉ tích hợp tại phase đã quy định để tránh sửa đi sửa lại.
- Ưu tiên chất lượng, bảo mật, tính đúng dữ liệu và khả năng bảo trì hơn tốc độ.

## Cách làm việc

- Đọc source thật trước khi kết luận.
- Đối chiếu README, docs, migration và database runtime.
- Khi tài liệu mâu thuẫn, ưu tiên source và database thực tế.
- Mỗi phase phải có:
  - phạm vi file;
  - code thay đổi;
  - migration liên quan;
  - test đã chạy;
  - kết quả build;
  - gate verdict;
  - vấn đề còn lại.
- Khi một lỗi lặp lại hai lần, dừng sửa ngẫu nhiên và phân tích nguyên nhân gốc.
- Chỉ sửa file ngoài manifest khi có bằng chứng bắt buộc và phải ghi rõ lý do.
- Không hỏi lại sau từng phase. Tự tiếp tục khi gate PASS.
- Chỉ dừng khi gặp blocker thật sự cần dữ liệu, quyền truy cập, secret hoặc quyết định nghiệp vụ không thể suy ra an toàn.

## Báo cáo cuối

Khi hoàn thành hoặc bị chặn, tạo báo cáo cuối gồm:

```text
1. Branch và baseline
2. Discovery verdict
3. Quyết định REUSE / EXTEND / REPLACE / DEPRECATED
4. Migration đã tạo
5. Database thay đổi
6. Backend/API đã hoàn thành
7. Frontend/UI đã hoàn thành
8. Authorization và IDOR
9. Concurrency
10. Session Snapshot
11. Set Logs
12. Progress
13. Dashboard
14. Build và tests
15. Files changed
16. Commits
17. Phần chưa hoàn thành
18. Blockers
19. Final verdict
```

Bắt đầu bằng việc đọc `README_TASK008_PLAN.md`, sau đó đọc và thực hiện `PROMPT_00_DISCOVERY.md`. Không triển khai nghiệp vụ trước khi Discovery PASS.
