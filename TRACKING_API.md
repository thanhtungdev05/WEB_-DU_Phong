# Tracking API

API này ghi nhận kết quả khi KTV kết thúc một bài lab. Portal và API chạy cùng origin nên luồng mặc định dùng phiên đăng nhập hiện tại.

## Endpoint

- `GET /api/index.php/tracking/health`: kiểm tra dịch vụ.
- `POST /api/index.php/tracking/timer`: ghi một kết quả cuối phiên.

## Xác thực

- Portal: gửi cookie phiên đăng nhập bằng `credentials: "same-origin"`.
- Tích hợp server-to-server: cấu hình `TRACKING_API_KEY` và gửi `X-Tracking-Key` hoặc `Authorization: Bearer <key>`.
- Nếu không có phiên đăng nhập và server không cấu hình API key, endpoint từ chối với HTTP 401. Không để API tracking chạy ẩn danh.
- Với phiên đăng nhập, server luôn dùng danh tính chuẩn của tài khoản và từ chối payload mạo danh KTV khác.

Không nhúng `TRACKING_API_KEY` vào JavaScript phía trình duyệt.

## Request

Ví dụ:

```json
{
  "submission_id": "2c60eb46-7414-4a1b-82d9-6038167e78a7",
  "lab_id": "LAB_AX3000S_01",
  "mode": "Thực hành",
  "session_type": "practice",
  "status": "completed",
  "is_passed": true,
  "device_id": "DEV_AX3000S",
  "started_at": "2026-08-24T14:14:00+07:00",
  "finished_at": "2026-08-24T14:15:00+07:00",
  "duration_sec": 60,
  "grading_details": []
}
```

Quy tắc quan trọng:

- `submission_id` bắt buộc, dài 8–64 ký tự an toàn và phải giữ nguyên khi retry cùng một lần nộp. Dùng lại ID cho kết quả khác trả HTTP 409.
- `lab_id` bắt buộc và phải là ID đang hoạt động trong `lab_catalog`; tên lab/thiết bị được server lấy lại từ danh mục.
- `mode` chỉ nhận `Thực hành` hoặc `Hướng dẫn`; `session_type` tương ứng là `practice` hoặc `guide`.
- `status` chỉ nhận `completed`, `failed`, `abandoned`.
- `is_passed` và `completed_first_try`, nếu có, phải là JSON boolean thật (`true`/`false`), không phải chuỗi.
- `is_passed` là kết quả chính thức: `true` khi đúng toàn bộ tiêu chí, ngược lại là `false`.
- Trường `score` chỉ còn được chấp nhận để tương thích client cũ, không được dùng để hiển thị hoặc tính tiến độ. `started_at` không được sau `finished_at`.
- Nên gửi timestamp ISO 8601 kèm múi giờ, ví dụ `+07:00`.

`technician_id`, `email` và `name` có thể gửi để đối chiếu, nhưng với phiên đăng nhập server sẽ dùng thông tin chuẩn của tài khoản.

## Response

HTTP 200 chỉ xác nhận dữ liệu thô đã được lưu khi `item.saved === true`:

```json
{
  "item": {
    "session_id": "6454",
    "submission_id": "2c60eb46-7414-4a1b-82d9-6038167e78a7",
    "saved": true,
    "duplicate": false,
    "normalized_saved": true,
    "normalization_issue": null
  }
}
```

- `duplicate: true`: retry hợp lệ; server không tạo bản ghi trùng.
- `normalized_saved: true`: kết quả đã liên kết với phân công lab và được dashboard KPI/ma trận sử dụng.
- `normalized_saved: false` cùng `normalization_issue: "no-active-assignment"`: bản ghi thô vẫn được lưu để đối soát, nhưng không tính vào tiến độ vì KTV không có phân công phù hợp đang hoạt động.

Lỗi có dạng:

```json
{
  "error": {
    "code": "tracking/unknown-lab",
    "message": "lab_id is not in the active catalog.",
    "requestId": "..."
  }
}
```

Giao diện phải hiển thị rõ trạng thái đang lưu, thành công, cảnh báo chưa liên kết phân công, hoặc thất bại; đồng thời cho phép retry với đúng `submission_id` cũ.

## Nghiệp vụ dashboard

- Chỉ attempt `practice` cập nhật trạng thái hoàn thành/đạt của `lab_assignments`.
- KTV chỉ được bắt đầu hoặc nộp kết quả cho bài lab thuộc ít nhất một lớp đang hiệu lực;
  gọi trực tiếp API với bài chưa được giao trả `403 tracking/not-assigned`.
- Attempt `guide` vẫn lưu lịch sử nhưng không làm tăng KPI thực hành.
- `completed` không có `is_passed: true` là “hoàn thành nhưng chưa có kết quả chấm”, không được tự suy diễn là đạt.
- Chỉ dữ liệu có bằng chứng pass/fail mới được dùng cho tỷ lệ đạt và lần đầu.

## Kiểm tra nhanh

1. Đăng nhập portal và hoàn thành một bài được phân công.
2. Xác nhận thông báo “đã lưu và cập nhật tiến độ”.
3. Kiểm tra Network: request trả HTTP 200, `saved=true`, `normalized_saved=true`.
4. Mở dashboard và tải lại; kết quả phải xuất hiện ở lịch sử và ma trận.
5. Gửi lại cùng payload/cùng `submission_id`; response phải có `duplicate=true` và không tăng số bản ghi.
