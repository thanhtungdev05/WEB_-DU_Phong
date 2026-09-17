# HƯỚNG DẪN TRIỂN KHAI PRODUCTION CHỊU TẢI CAO (> 1.000 KTV TOÀN QUỐC)
**Dự Án: FTC Virtual Devices (Hệ Thống Mô Phỏng Thiết Bị Mạng FPT)**

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo mô hình **Phân tầng chịu lực (Multi-tier Enterprise Architecture)**, tách biệt rạch ròi giữa việc phục vụ dữ liệu tĩnh (Static Assets), logic mô phỏng thiết bị (Simulators) và API nghiệp vụ/chấm điểm (PHP API & Django Admin).

```
                      [ > 1.000 KỸ THUẬT VIÊN TOÀN QUỐC ]
                                       │
                                       ▼ Cổng 80 / 443
┌─────────────────────────────────────────────────────────────────────────────┐
│  NGINX REVERSE PROXY & STATIC ACCELERATOR                                   │
│  - Tiếp nhận và duy trì 10.000+ kết nối đồng thời (Non-blocking I/O)        │
│  - Trực tiếp phục vụ và cache toàn bộ file tĩnh (CSS, JS, Hình ảnh thiết bị)│
│  - Bật nén Gzip: Giảm 75% băng thông cho KTV ở các chi nhánh tỉnh           │
│  - Định tuyến Sticky Session (ip_hash) cho cụm máy chủ mô phỏng             │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │ /api/*                        │ /sim_* & /portal
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────────────────────┐
│ DỊCH VỤ PHP API              │ │ DỊCH VỤ PYTHON SIMULATORS DISPATCHER       │
│ - Port 8081 (Đa luồng worker)│ │ - Port 8080 (Multi-threading, Multi-user)  │
│ - Xử lý đăng nhập, chấm điểm │ │ - 12 Thiết bị mạng (AX3000C, BE12000...)   │
│ - Nhập/xuất danh sách XLSX   │ │ - Trạng thái cấu hình cô lập theo từng KTV │
└──────────────┬───────────────┘ └────────────────────────────────────────────┘
               │ Kết nối DB
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CƠ SỞ DỮ LIỆU POSTGRESQL (Khuyến nghị dùng Neon Pooler hoặc PgBouncer)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. YÊU CẦU PHẦN CỨNG MÁY CHỦ (SERVER SPECIFICATIONS)

Để phục vụ mượt mà cho **1.000 – 2.000 KTV thi đồng thời** trên toàn quốc:

| Thông số | Cấu hình tối thiểu (Min) | Cấu hình khuyến nghị (Recommended) |
| :--- | :--- | :--- |
| **CPU** | 8 vCPU | 16 vCPU |
| **RAM** | 16 GB | 32 GB RAM |
| **Ổ cứng** | 50 GB SSD NVMe | 100 GB SSD NVMe (tốc độ đọc file tĩnh cực nhanh) |
| **Băng thông mạng** | 500 Mbps trong nước | 1 Gbps – 2 Gbps đường truyền nội bộ FPT / VN |
| **Hệ điều hành** | Ubuntu Server 22.04 LTS | Ubuntu Server 22.04 / 24.04 LTS hoặc RHEL 9 |

---

## 3. CÁC BƯỚC TRIỂN KHAI NHANH

### Bước 1: Cấu hình biến môi trường (`.env`)
Tạo hoặc cập nhật file `.env` ở thư mục gốc của dự án:
```bash
# Cấu hình kích hoạt Production (> 1.000 KTV Toàn Quốc)
PRODUCTION=1

# Cấu hình Database PostgreSQL (Khuyến nghị dùng connection string có pooler)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Cấu hình bảo mật session
SESSION_SECRET=fpt_telecom_super_secret_key_2026

# Số lượng worker cho API chấm điểm (đối với server 8-16 vCPU nên đặt 16-32)
PHP_API_WORKERS=16
DJANGO_WORKERS=4
DJANGO_THREADS=8
```

### Bước 2: Khởi động hệ thống Production
Bạn **CHỈ CẦN CHẠY ĐÚNG 1 LỆNH DUY NHẤT**:
```bash
python run_all.py
```
> **Cơ chế tự động hóa:** Khi file `.env` có `PRODUCTION=1` (hoặc truyền cờ `python run_all.py --prod`), script `run_all.py` sẽ **tự động kích hoạt toàn bộ cụm Production chịu tải cao** (Nginx + Cụm Dispatcher + PHP-FPM/Multi-Workers) mà bạn không cần phải nhớ bất kỳ câu lệnh Docker dài dòng nào!
>
> *(Nếu muốn dừng cụm Production, bạn chỉ cần gõ: `python run_all.py --stop`)*

---

## 4. TỐI ƯU HÓA KẾT NỐI DATABASE CHO > 1.000 KTV

Mặc định PostgreSQL giới hạn `max_connections = 100`. Khi có hơn 1.000 KTV nộp bài thi cùng lúc:
- **Nếu dùng Neon PostgreSQL Serverless:**
  - Hãy sử dụng **Pooled Connection String** (host thường có dạng `ep-xxxx-pooler.region.neon.tech`). Neon tự động cân bằng hàng chục nghìn kết nối mà không bao giờ bị nghẽn.
- **Nếu dùng máy chủ PostgreSQL tự host:**
  - Cần nâng `max_connections` trong `postgresql.conf` lên tối thiểu `300`:
    ```ini
    max_connections = 300
    shared_buffers = 4GB
    ```

---

## 5. GIÁM SÁT & QUẢN TRỊ KHI ĐANG DIỄN RA KỲ THI

1. **Giám sát tải CPU và RAM thời gian thực:**
   ```bash
   docker stats
   ```
   *Lưu ý: Nếu container `app` ăn trên 80% CPU trong thời gian dài, có thể tăng thêm số lượng worker hoặc scale ngang.*

2. **Kiểm tra thời gian phản hồi (Latency) từ Nginx:**
   Xem log Nginx để biết request nào bị chậm:
   ```bash
   docker exec -it ftc-proxy tail -f /var/log/nginx/access.log
   ```
   Trường `rt=...` ở cuối dòng log hiển thị thời gian xử lý của request (chuẩn là `< 0.050s`).

3. **Khởi động lại nhanh nếu cần thiết:**
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

---

## 6. SO SÁNH GIỮA CHẾ ĐỘ DEV VÀ CHẾ ĐỘ PRODUCTION

| Tiêu chí | Chế độ Dev (Máy cá nhân) | Chế độ Production (> 1.000 KTV) |
| :--- | :--- | :--- |
| **Lệnh chạy** | `python run_all.py` | `docker compose -f docker-compose.prod.yml up -d` |
| **Cổng truy cập** | `http://localhost:8080` | `http://<IP_Server>` (Cổng 80/443 chuẩn) |
| **Phục vụ file tĩnh** | Do Python đọc từ đĩa | Do Nginx phục vụ trực tiếp + Nén Gzip |
| **Khả năng chịu tải** | 50 – 100 kết nối đồng thời | **10.000+ kết nối đồng thời** |
| **Tác động mã nguồn** | Không ảnh hưởng | Không ảnh hưởng (dùng chung 100% source code) |
