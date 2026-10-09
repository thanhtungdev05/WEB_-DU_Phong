# FPT Codex Tooling Kit

Target stack:
- PHP 8.2+ custom REST API + PDO PostgreSQL
- Django 5.2 Admin only
- Python 3.12 stdlib dispatcher / reverse proxy
- PostgreSQL / Neon
- Vanilla HTML/CSS/JavaScript
- FPT IAM / Keycloak-compatible OAuth2
- Custom SQL migrations
- PhpSpreadsheet
- Docker/Gunicorn/PHP CLI runtime

Explicitly excluded:
- crawler
- emulator
- device selector automation
- Shadow DOM device tooling

## Install

Extract this ZIP, then from PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup_fpt_codex_tooling.ps1 -ProjectRoot "D:\FPT INTERN\VirtualDevices\FTC-VirtualDevices"
```

The installer is conservative:
- existing files are preserved where possible;
- legacy generic skills are not deleted automatically;
- the new exact-stack skills are installed alongside them;
- an AGENTS.md stack-specific block is appended once;
- a single multi-stack check script is added.

After setup, restart Antigravity and ask Codex:

```text
Read AGENTS.md and list the exact project-local skills available for this repository.
Do not modify anything.
```

Then run:

```powershell
.\scripts\check.ps1
```

## Recommended MCP profile

`fpt_web_tools`:
- Context7
- GitHub Official
- Playwright

| Dịch vụ | Đường dẫn truy cập | Mô tả |
| :--- | :--- | :--- |
| 🏠 **Portal Trung Tâm** | `http://localhost:8080/` | Trang chủ chọn thiết bị và chế độ thực hành |
| 📊 **Dashboard Đào Tạo** | `http://localhost:8080/dashboard/` | Báo cáo tiến độ, KPI, ma trận kết quả KTV |
| ⚙️ **Trang Quản Trị Admin** | `http://localhost:8080/admin/` | Quản lý KTV, Lớp học, Bài Lab, Timer Sessions, Xuất CSV |
| 🔌 **PHP REST API** | `http://localhost:8080/api/` | API chấm điểm, tracking, IAM auth |
| 📡 **8 Thiết bị Giả lập** | `http://localhost:8080/sim_<model>/` | Giao diện cấu hình AC1000F, AX3000C, AX3000GZ, AX3000HV2, AX3000S, BE12000, BE15000, Vigor2927 |

### 🔐 Thông Tin Đăng Nhập Trang Admin
- **URL**: `http://localhost:8080/admin/`
- **Tài khoản**: Cấu hình tại biến `DJANGO_SUPERUSER_USERNAME` (mặc định: `admin`)
- **Mật khẩu**: Cấu hình tại biến `DJANGO_SUPERUSER_PASSWORD` trong file `.env`

---

## 🛠 4. Các Tính Năng Đào Tạo Cốt Lõi

### A. Danh sách các dòng thiết bị giả lập (Simulators)
Dự án đã giả lập thành công Web Admin Interface của 12 dòng thiết bị mạng thực tế phổ biến của FPT Telecom:
1. **AC1000F** (`/sim_ac1000f`)
2. **AC1000HI** (`/sim_ac1000HI`)
3. **AX3000C** (`/sim_ax3000c`)
4. **AX3000GZ** (`/sim_ax3000gz`)
5. **AX3000Hv2** (`/sim_ax3000hv2`)
6. **AX3000S** (`/sim_ax3000s`)
7. **BE12000** (`/sim_be12000`)
8. **BE15000** (`/sim_be15000`)
9. **ONT BE6500C** (`/sim_ONT_be6500c`)
10. **AP BE6500C** (`/sim_be6500c`)
11. **Vigor2927** (`/sim_vigor2927`)
12. **Router MikroTik** (`/sim_mikrotik_hexs`)

### B. Hai Chế Độ Hoạt Động (Dual Modes)
1. **💡 Chế độ Hướng dẫn (Guide Mode):**
   - **Mục đích:** Học tập và rèn luyện.
   - **Tính năng:**
     - Hiển thị bong bóng hướng dẫn (Tooltips) chỉ dẫn từng bước thao tác thực tế. Tooltips tự động đồng bộ theo từng trang con của thiết bị (chuyển trang WLAN, SNTP, Mesh, Port Forwarding...).
     - KTV được phép cấu hình sai. Khi ấn **Nộp Bài**, hệ thống sẽ hiện bảng báo lỗi, cho phép đóng bảng điểm để **quay lại giao diện cũ sửa lỗi** và nộp lại.
     - **Chỉ ghi nhận Tracking (Log) khi đạt 100%**: Tránh ghi nhận dữ liệu không hoàn chỉnh của học viên.

2. **⚡ Chế độ Thực hành (Practice Mode):**
   - **Mục đích:** Kiểm tra, thi thật.
   - **Tính năng:**
     - Ẩn toàn bộ hướng dẫn, ép KTV tự nhớ các thông số cấu hình chuẩn FPT.
     - **Khắt khe:** Nếu chấm điểm bị sai dù chỉ 1 tiêu chí, hệ thống khóa màn hình, yêu cầu "Quay lại làm từ đầu" và **reset toàn bộ thiết bị** (mất toàn bộ cấu hình đã lưu).
     - Gửi Tracking dữ liệu lập tức (bất kể Đạt hay Chưa đạt) ngay khi nhấn Nộp Bài để nạp vào Data Dashboard.

### C. Chấm Điểm Tự Động Thông Minh (Smart Auto-Grading)
- **Lấy dữ liệu trực tiếp từ Iframe giả lập:** Dùng DOM query để đọc dữ liệu KTV đã nhập, so khớp với bộ quy tắc chuẩn (`rules`).
- **Luật chấm điểm động linh hoạt:** Hỗ trợ chấm điểm phức tạp như kiểm tra giá trị bất kỳ trong danh sách (vd: NTP Server được chọn ứng cử viên thuộc `vn.pool.ntp.org` hoặc `asia.pool.ntp.org` bằng định dạng `any_of`).
- **Lưu bộ nhớ tạm (Cache đa trang):** Khắc phục nhược điểm KTV phải chuyển trang khi cấu hình. Hệ thống tự động bắt tín hiệu *Save* từ bên trong iframe, lấy điểm từng phần lưu vào `CACHE` cục bộ và gộp chung toàn bộ khi nhấn "Nộp Bài" ở ngoài Portal chính.

### D. Ngăn Chặn Tải Lại Trang (Anti-Reload Script)
Thiết bị thực tế thường khởi động lại hoặc load lại trang khi bấm Save. Trong giả lập:
- Tích hợp bộ script Python (vd: `fix_saves.py`) tự động quét mã nguồn `.asp` của các giả lập.
- Chèn Javascript ngăn lệnh submit, hiển thị thông báo giả lập `✔ Saved successfully!` và gửi tín hiệu báo cáo cho Portal ở lớp vỏ ngoài.

### E. Hệ thống Tracking API & Telemetry
- Tích hợp sẵn endpoint `/api/index.php/tracking/timer`.
- Ghi nhận: ID KTV, Tên Bài Học, Điểm số, Tổng thời gian hoàn thành (tính bằng giây), địa chỉ IP, User Agent, loại phiên và danh sách các lỗi cấu hình.
- 100% không bị gửi đúp dữ liệu nhờ màng lọc logic thông minh tại nút "Nộp Bài".

---

## 📊 5. Dashboard Giám Sát KTV (Training Management Dashboard)

Dự án cung cấp một Dashboard quản trị hoàn chỉnh dành cho Admin/Giảng viên để theo dõi, thống kê tiến độ học tập và kết quả của các KTV.

- **Đường dẫn truy cập:** `http://localhost:8080/dashboard/` (được mount tự động từ thư mục `dashboard-authen`).
- **Bảo mật & Phân quyền**: Yêu cầu đăng nhập trước thông qua hệ thống IAM FPT (hoặc Dev Bypass mode trên localhost) và bắt buộc tài khoản có quyền `admin`.
- **Chức năng chính:**
  - Thống kê tổng số học viên (KTV), tổng số lượt làm bài (Sessions), tỉ lệ đạt (Pass Rate), tỉ lệ đạt lần đầu (First-pass Rate).
  - So sánh hiệu suất học tập giữa các lớp (Class Code), các khu vực/vùng miền (Dashboard Region).
  - Phân tích chi tiết biểu đồ tiến độ qua các tháng, danh sách chi tiết các lượt làm bài, trạng thái đạt/chưa đạt kèm thời gian và bài thực hành cụ thể.
  - Tra cứu kết quả phân công bài tập (Assignments) và tiến trình hoàn thành của từng nhân viên.

---

## 💾 6. Cơ Sở Dữ Liệu & Migrations

Hệ thống sử dụng cơ sở dữ liệu quan hệ **PostgreSQL** (mặc định kết nối Neon Cloud qua biến môi trường `DATABASE_URL` trong file `.env`).

Sơ đồ khóa ngoại, quy tắc xóa và các cột snapshot được mô tả tại
[`docs/DATABASE_RELATIONSHIPS.md`](docs/DATABASE_RELATIONSHIPS.md).

### Quản lý Schema qua Migrations
Mọi thay đổi cấu trúc bảng, view hay dữ liệu mẫu đều được quản lý thông qua các file di trú phiên bản đặt trong thư mục `api/migrations/`.
Các lệnh CLI hữu ích để quản lý cơ sở dữ liệu:
* **Kiểm tra trạng thái di trú:** `php api/migrate.php --status`
* **Chạy di trú (Cập nhật Schema):** `php api/migrate.php`
* **Khởi tạo dữ liệu KTV & Sessions mẫu (Seed):** `php api/seed_dashboard_ktv.php`
* **Xác minh tính đúng đắn của dữ liệu mẫu:** `php api/verify_dashboard_seed.php`

---

## 🆕 7. Cập Nhật Cấu Trúc & Logic Mới Nhất (Dành Cho Developer)

Để giúp các lập trình viên tiếp quản dự án dễ dàng nắm bắt, dưới đây là các thay đổi quan trọng về luồng logic và UI/UX đã được triển khai gần đây:

### A. Chuẩn Hóa Tên Danh Mục Thiết Bị
- Tên thiết bị trên Dropdown Menu đã được cấu trúc lại với các tiền tố rõ ràng để KTV dễ phân biệt chủng loại:
  - **Dòng ONT:** `ONT AC1000F`, `ONT AC1000HI`, `ONT AX3000CV2`, `ONT AX3000GZ`, `ONT AX3000HV2`, `ONT AX3000S`, `ONT AC1000C V2`, `ONT BE1200Z`, `ONT BE6500C`
  - **Dòng AP / Router:** `AP BE6500C`, `AP BE1500Z`, `Router MikroTik`, `DrayTek Vigor 2927`
- Thứ tự (Order) hiển thị trên giao diện được quản lý đồng bộ qua database catalog và các file `data.js`.

### B. Auto-Baseline Tracker (Tối ưu thiết bị SPA)
- Thay vì lấy Baseline toàn bộ DOM ngay lúc load (gây lỗi với các thiết bị dạng SPA sinh form trễ do AJAX như AX3000S), hệ thống đổi sang **Interaction-Based Baseline**.
- Hàm `captureBeforeEdit` sẽ lưu lại giá trị mặc định của ô nhập liệu *ngay khoảnh khắc KTV chạm vào ô đó* (`mousedown` / `focusin`).
- Đảm bảo cơ chế chấm lỗi "Cấu hình sai trường ngoài yêu cầu" (`unexpected_change`) chính xác tuyệt đối mà không bị xung đột với lifecycle của giả lập.

### C. Giam Kẹp Logic "Nộp Bài" & "Xem Lỗi Sai"
- **Bắt buộc Save:** Các nút chức năng đánh giá (Nộp bài / Xem lỗi sai) mặc định bị vô hiệu hóa (disabled, ẩn xám). Chúng chỉ kích hoạt khi KTV đã thực sự bấm nút **Save/Apply** trên giao diện của thiết bị giả lập.
- **Reset trạng thái lập tức:** Bất kỳ thao tác gõ phím (`input`) hay thay đổi tùy chọn (`change`) nào cũng sẽ lập tức thu hồi trạng thái "Đã Save". Sự kiện được bắt ở cấp cao nhất (Capture phase `true`) để tránh tình trạng Javascript của Emulator ẩn event.
- **UX Layout:** Nút "Xem lỗi sai" và "Nộp bài" được gom về cạnh nhau phía góc phải màn hình, đẩy đồng hồ đếm ngược sang trái giúp KTV thao tác thuận tay hơn.

### D. Multi-Error Reporting (Bảng Báo Lỗi Chi Tiết)
- Trong chế độ Hướng dẫn (Guide Mode), thay vì hiển thị tooltip sơ sài, KTV nhấn "Xem lỗi sai" sẽ thấy Modal liệt kê toàn bộ các tiêu chí cấu hình sai dưới dạng Bảng.
- Hệ thống hỗ trợ lấy định danh Text thân thiện (`getLabelForElement`) và dịch ngược option của thẻ Select thay vì hiển thị value thô báo lỗi cho KTV.
- Thời gian làm bài trên bảng lỗi được lấy Realtime đúng theo đồng hồ đếm ngược.

---

## 🛑 8. Hướng Dẫn Dừng Hệ Thống

- **Windows (CMD/PowerShell)**: Đóng cửa sổ CMD đang chạy (hoặc nhấn `Ctrl + C`).
- **Terminal (macOS/Linux)**: Nhấn `Ctrl + C` tại cửa sổ Terminal đang chạy script để dừng toàn bộ dịch vụ Python và PHP nội bộ.

---

## 📝 9. Ghi Chú

- Giữ nguyên cửa sổ terminal/CMD trong suốt quá trình thực hành.
- Nếu bạn có thay đổi cấu trúc thiết bị và luồng lưu file, hãy chạy lại lệnh vá file của Python để giả lập hoạt động đúng với Portal.
- Đảm bảo cổng `8080` không bị chiếm dụng trước khi bật file Batch/Python.
