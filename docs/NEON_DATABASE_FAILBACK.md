# Chuyển dữ liệu từ Neon dự phòng về database cũ

Có thể chuyển toàn bộ dữ liệu về project/database cũ sau khi quota được reset. Đây là một lần **cutover**, không phải cơ chế đồng bộ hai chiều. Trong lúc dump/restore, ứng dụng phải dừng ghi hoặc chuyển sang maintenance/read-only để không mất các bản ghi phát sinh sau thời điểm dump.

## Quy trình an toàn

1. Tạo branch/database đích mới, trống trong project Neon cũ nếu có thể. Đây là lựa chọn an toàn hơn ghi đè database cũ đang chứa dữ liệu stale.
2. Đưa web vào maintenance/read-only và ghi lại thời điểm dừng ghi.
3. Đặt hai connection string chỉ trong shell hiện tại, không ghi vào repository:

   ```powershell
   $env:NEON_SOURCE_DATABASE_URL = '<database dự phòng đang dùng>'
   $env:NEON_TARGET_DATABASE_URL = '<database đích trong project cũ>'
   ```

4. Chạy dry-run để kiểm tra đúng source/target:

   ```powershell
   ./scripts/neon_failback.ps1
   ```

5. Restore vào database trống. Nếu buộc phải thay thế database stale, thêm `-ReplaceTarget`; tùy chọn này chạy `pg_restore --clean --if-exists` và xóa các object trùng tên ở đích:

   ```powershell
   ./scripts/neon_failback.ps1 -Execute -ConfirmTargetDatabase '<tên database>'
   # Hoặc, chỉ sau khi đã backup database đích:
   ./scripts/neon_failback.ps1 -Execute -ReplaceTarget -ConfirmTargetDatabase '<tên database>'
   ```

6. Trên database đích, chạy `php api/migrate.php` và Django migrations như quy trình deploy.
7. So sánh migration ledger và row count của các bảng quan trọng: `users`, `timer_sessions`, `training_classes`, `class_enrollments`, `lab_assignments`, `app_sessions`.
8. Kiểm thử đăng nhập, portal, nộp lab, dashboard và admin. Giữ nguyên cả hai connection string, đặt `DATABASE_ACTIVE` về tier đích rồi deploy. Không hoán đổi ý nghĩa của `DATABASE_URL` và `FALLBACK_DATABASE_URL`.
9. Giữ database dự phòng ở chế độ chỉ đọc trong một khoảng rollback; không cho hai database cùng nhận ghi.

## Lưu ý

- `pg_dump`/`pg_restore` phải cùng major version hoặc client mới hơn server.
- Connection string được truyền cho tiến trình PostgreSQL cục bộ; chỉ chạy trên máy quản trị tin cậy và xóa biến môi trường sau khi hoàn tất.
- Không restore `app_sessions` nếu muốn buộc toàn bộ người dùng đăng nhập lại; nếu restore bảng này, cookie cũ vẫn chỉ hợp lệ khi khóa/cấu hình session không đổi.
- Nếu dữ liệu tiếp tục được ghi trong lúc dump, cần một lần đồng bộ delta hoặc dừng ghi rồi dump lại. Với Neon free plan, cutover có downtime ngắn là phương án ít rủi ro nhất.
