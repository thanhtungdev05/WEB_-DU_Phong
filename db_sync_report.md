# Kiểm tra đồng bộ Primary ↔ Fallback Database

## ❌ Kết luận: KHÔNG có auto-sync

**Primary và Fallback database KHÔNG tự động đồng bộ với nhau.** Đây là thiết kế có chủ ý để tránh split-brain writes.

---

## Kiến trúc hiện tại

```
PRIMARY DB (Neon)          FALLBACK DB (Neon)
DATABASE_URL               FALLBACK_DATABASE_URL
     │                           │
     └─────── DATABASE_ACTIVE ───┘
               = "primary" | "fallback"
               (chỉ một tier nhận ghi tại một thời điểm)
```

### Cơ chế hoạt động thực tế

| Thành phần | Làm gì với Fallback? |
|---|---|
| `db_guardian.py` | Chỉ **ping kết nối** standby để check alive (không ghi, không đọc data) |
| `run_all.py` | Khởi động `db_guardian`, **không có lịch sync** nào |
| `sync_fallback_db` | Django management command — **chạy tay** (`python manage.py sync_fallback_db`) |
| `merge_fallback_into_primary.py` | Script đặc biệt — **chạy tay**, yêu cầu nhập `MERGE_FALLBACK_INTO_PRIMARY` để xác nhận |
| PHP API / Django Admin | **Luôn ghi vào active tier** (primary hoặc fallback tùy `DATABASE_ACTIVE`), không ghi cả hai |

---

## Các rủi ro hiện tại

### 🔴 Rủi ro 1: Fallback có thể đã lỗi thời
Nếu `DATABASE_ACTIVE=primary` và bạn chưa chạy `sync_fallback_db` gần đây, fallback database **thiếu tất cả dữ liệu mới** kể từ lần sync cuối.

**Khi nào cần sync?** Mỗi khi có dữ liệu mới quan trọng, trước khi cần chuyển sang fallback.

### 🟡 Rủi ro 2: Schema lệch nhau
Nếu deploy migration mới nhưng chưa chạy `sync_fallback_db --schema-only`, fallback có thể thiếu bảng/cột → chuyển sang fallback sẽ lỗi ngay.

### 🟡 Rủi ro 3: Không có kiểm tra lag tự động
`db_guardian` chỉ báo "connection OK" của standby, không báo **dữ liệu đã đồng bộ bao lâu rồi** hay **thiếu bao nhiêu dòng**.

---

## Cách đồng bộ thủ công hiện có

### Sync từ Primary → Fallback (bình thường)
```powershell
# Xem trước (dry-run)
python admin_app/manage.py sync_fallback_db --dry-run

# Chạy thật
python admin_app/manage.py sync_fallback_db

# Chỉ schema (sau khi deploy migration mới)
python admin_app/manage.py sync_fallback_db --schema-only

# Chỉ dữ liệu
python admin_app/manage.py sync_fallback_db --data-only
```

### Failback: Merge Fallback → Primary (sau sự cố)
```powershell
# Đọc kỹ, yêu cầu nhập xác nhận "MERGE_FALLBACK_INTO_PRIMARY"
python scripts/merge_fallback_into_primary.py
```

### Failback hoàn toàn (dump/restore)
```powershell
$env:NEON_SOURCE_DATABASE_URL = '<fallback URL>'
$env:NEON_TARGET_DATABASE_URL = '<primary URL>'
./scripts/neon_failback.ps1 --dry-run
./scripts/neon_failback.ps1 -Execute -ConfirmTargetDatabase '<tên database>'
```

---

## Đề xuất cải thiện

### Ngắn hạn (không cần code mới)
1. **Chạy ngay** `python admin_app/manage.py sync_fallback_db` để đồng bộ schema + dữ liệu hiện tại
2. **Ghi lịch** sync thủ công: ví dụ mỗi tuần hoặc trước mỗi deploy quan trọng

### Trung hạn (cần code nhỏ)
Thêm vào `db_guardian.py` một task báo cáo **tuổi dữ liệu** của fallback (lần write cuối của bảng `timer_sessions`):
```python
# Ý tưởng: so sánh MAX(updated_at) hoặc MAX(id) của bảng quan trọng
# giữa primary và fallback để biết fallback đang lệch bao nhiêu
```
→ Hiển thị trong widget `/api/system/usage` dưới dạng `"fallbackLagHours": 48`

### Nếu muốn sync tự động
Cần cân nhắc kỹ: **auto-sync có rủi ro** vì nếu primary bị lỗi giữa chừng và đang ghi, sync tự động có thể nhân bản dữ liệu hỏng sang fallback. Kiến trúc hiện tại "sync tay có kiểm soát" là phù hợp với quy mô hiện tại.

> [!WARNING]
> Không thay đổi `DATABASE_ACTIVE` khi chưa sync và chưa verify. Nếu chuyển sang fallback khi data lệch, các bản ghi mới nhất sẽ mất.
