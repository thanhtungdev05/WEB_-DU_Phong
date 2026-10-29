# BÁO CÁO ĐÁNH GIÁ HẠ TẦNG CLOUD RENDER & PHƯƠNG ÁN NÂNG CẤP HỆ THỐNG FTC

**Kính gửi:** Anh Khoa, Anh Xanh  
**Người thực hiện:** Team Kỹ thuật FTC — Dự án Giả lập Thiết bị Mạng  
**Ngày báo cáo:** 27/10/2026  
**Dự án:** FTC Virtual Devices (Hệ thống Giả lập Thiết bị & Sát hạch KTV FPT)

---

## 📌 I. TỔNG QUAN & LÝ DO ĐÁNH GIÁ GÓI PRO RENDER (25$/THÁNG)

Vừa qua, hệ thống thi và luyện tập giả lập thiết bị mạng của KTV gặp sự cố bị tạm ngưng (`Workspace Suspended by owner`) do chạm trần **5 GB băng thông miễn phí/tháng** của Render. 

Team kỹ thuật đã vào cuộc rà soát toàn diện và xử lý triệt để:
1. **Tối ưu hóa mã nguồn:** Nén Gzip 75% và thiết lập bộ nhớ đệm Cache vĩnh viễn trên trình duyệt, giảm dung lượng tải mỗi lượt KTV từ 25 MB xuống **dưới 0.5 MB** (tiết kiệm 98% băng thông).
2. **Khắc phục lỗi tiến trình:** Sửa lỗi xung đột Gunicorn gây mã lỗi 502 Bad Gateway khi khởi động.
3. **Chuyển đổi đăng nhập:** Thay thế nút đăng nhập IAM bị lỗi chuyển hướng bằng form đăng nhập trực tiếp **Email FPT (`@fpt.net`, `@fpt.com`)**, tự động ghi nhận điểm thi vào Database Neon.
4. **Kiểm thử tải cao:** Đã chạy mô phỏng tải **1.000 KTV đồng thời đạt tỷ lệ thành công 100%**, thời gian phản hồi trung bình chỉ **188.6 ms**.

Để đảm bảo hệ thống vận hành bền vững, phục vụ các kỳ sát hạch quy mô lớn sắp tới và mở rộng thêm nhiều phân hệ đào tạo, team thực hiện báo cáo đánh giá chi tiết về **gói Pro Workspace (25$/tháng)** và các lựa chọn hạ tầng trên Render.

---

## 🔍 II. BẢN CHẤT GÓI 25$/THÁNG TRÊN RENDER & LÀM RÕ VẤN ĐỀ DATABASE

### 1. Gói 25$/tháng thực chất là gì?
- Đây là **Phí Nền Tảng Doanh Nghiệp (Pro Workspace)** cho toàn bộ tài khoản, không phải là chi phí cho một máy chủ đơn lẻ.
- Cung cấp sẵn **25 GB băng thông ra ngoài (outbound)/tháng** (gấp 5 lần gói Free).
- **Cơ chế chống khóa dịch vụ:** Khi dùng vượt mức 25 GB, web **KHÔNG BAO GIỜ BỊ KHÓA**, Render chỉ tính thêm 0.15$/GB (~3.500đ/GB) vào hóa đơn cuối tháng.
- Cấp quyền quản lý không giới hạn số lượng Web Service trong cùng một Workspace.

### 2. Có cần mua thêm Database PostgreSQL trên Render không?
> **KẾT LUẬN: HOÀN TOÀN KHÔNG CẦN.**
- Gói 25$ không bao gồm Managed Postgres của Render (Render bán riêng từ $7/tháng).
- Tuy nhiên, hệ thống FTC đang chạy cơ sở dữ liệu trên **Neon Cloud Serverless PostgreSQL** hoàn toàn độc lập và miễn phí.
- Cơ sở dữ liệu hiện đang lưu an toàn:
  - **6.533 tài khoản KTV** (bảng `users`).
  - **20.300 lịch sử bài thi** (bảng `timer_sessions`).
  - Mới sử dụng **~150 MB / 512 MB** dung lượng miễn phí của Neon, còn trống đủ lưu thêm **hơn 500.000 kết quả bài thi**.
- Do đó, Render chỉ đóng vai trò chạy ứng dụng Web/Docker, **không tốn thêm bất kỳ chi phí database nào**.

---

## 📊 III. SO SÁNH NĂNG LỰC CỦA CÁC GÓI TRÊN RENDER

| Tiêu chí | Mức 1: Gói Free ($0) | Mức 2: Gói Starter ($7/tháng) | Mức 3: Gói Pro Workspace ($25/tháng) |
| :--- | :--- | :--- | :--- |
| **Chi phí cố định** | **0 VNĐ** | **~170.000 VNĐ / tháng** | **~600.000 VNĐ / tháng** |
| **Cấu hình phần cứng** | 0.1 CPU, 512 MB RAM | 0.5 CPU, 512 MB RAM | 1.0 CPU, 2.0 GB RAM |
| **Số người dùng đồng thời (CCU)** | **30 – 50 CCU** | **100 – 150 CCU** | **300 – 500 CCU** |
| **Khả năng phục vụ trong ngày** | ~500 lượt thi/ngày | **1.200 – 2.000 lượt thi/ngày** | **> 5.000 lượt thi/ngày** |
| **Khả năng phục vụ trong tháng** | ~10.000 lượt thi/tháng | ~30.000 lượt thi/tháng | **> 50.000 lượt thi/tháng** (Không giới hạn) |
| **Hiện tượng ngủ đông (Spin-down)** | Tự tắt sau 15p (mở lại chờ 30s) | **Chạy 24/7, mở tức thì 0.1s** | **Chạy 24/7, mở tức thì 0.1s** |
| **Nguy cơ bị khóa web (Suspended)** | Có (nếu vượt 5 GB) | Rất thấp | **0% (Không bao giờ bị khóa)** |
| **Hóa đơn tài chính cho Kế toán FPT** | ❌ Không có | Có hóa đơn điện tử | ✅ **Hóa đơn PDF đầy đủ Tên Cty + MST** |
| **Khả năng chạy nhiều dự án** | 1 – 2 dự án (bị giới hạn 750 giờ) | Tùy chọn theo từng máy chủ | **5 – 20+ dự án không giới hạn** |

---

## 👥 IV. ĐÁNH GIÁ TẢI THỰC TẾ: BÀI TOÁN "14 USER GIÁM SÁT RẢI RÁC"

- **Phân tích hành vi:** 14 user (Giám sát, Giảng viên, KTV thi rải rác) không thao tác đồng thời trong cùng 1 giây. Lúc cao điểm nhất chỉ có khoảng **2 – 4 CCU** online cùng lúc.
- **Tải thực tế:**
  - Tần suất request: Chỉ khoảng **0.05 – 0.1 request/giây**.
  - Tiêu thụ RAM: Ổn định ở mức **~160 MB / 512 MB RAM**.
  - Băng thông: Cả tháng tiêu thụ chưa tới **800 MB** (chưa hết 1/6 định mức 5 GB miễn phí).
- **Kết luận:** Nhu cầu hiện tại của 14 user chỉ chiếm **dưới 3% công suất** của máy chủ. Gói Free hay Starter đều dư sức đáp ứng về mặt hiệu năng. Điểm khác biệt duy nhất là gói Starter ($7) sẽ không bị trễ 30s ngủ đông khi có người mở web.

---

## 🚀 V. KHẢ NĂNG MỞ RỘNG TRIỂN KHAI CÁC DỰ ÁN MỚI

Nếu nâng cấp tài khoản, team dự kiến có thể tận dụng hạ tầng này để mở rộng thêm các phân hệ đào tạo cho FPT:

1. **Dự án 1 (Hiện tại):** Giả lập 15 dòng router/modem mạng FTC (87 bài lab thực hành).
2. **Dự án 2 (Mở rộng):** Giả lập cấu hình FPT Camera, đầu ghi Cloud, cài đặt FPT Play Box.
3. **Dự án 3 (Mở rộng):** Cổng thi trắc nghiệm lý thuyết và quy trình KTV (tận dụng danh bạ 6.500+ KTV sẵn có).
4. **Dự án 4 (Mở rộng):** Bảng xếp hạng và Dashboard thống kê điểm kỹ thuật toàn quốc theo 7 Vùng.
5. **Dự án 5 (Mở rộng):** Các công cụ tiện ích nội bộ phục vụ tra cứu mã lỗi và thông số mạng NOC.

*Nhờ kiến trúc Monorepo Dispatcher, các phân hệ mới có thể tích hợp chạy chung trên cùng một máy chủ mà **không làm phát sinh thêm chi phí thuê server mới**.*

---

## 🎯 VI. ĐỀ XUẤT 3 PHƯƠNG ÁN XIN Ý KIẾN CHỈ ĐẠO

### 🟢 Phương án 1: Dùng Gói Free ($0 VNĐ)
- **Ưu điểm:** Tiết kiệm 100% chi phí. Đủ sức phục vụ 14 user rải rác nhờ code đã nén tối ưu.
- **Nhược điểm:** Web tự tắt sau 15 phút không ai truy cập, người bấm tiếp theo phải chờ 30 giây để web thức dậy. Vẫn có rủi ro nếu có đợt thi đột xuất trên 50 người cùng lúc.
- **Phù hợp:** Giai đoạn thử nghiệm nội bộ nhỏ, chưa có kinh phí.

### 🟡 Phương án 2: Dùng Gói Starter ($7/tháng ~ 170.000 VNĐ/tháng) — KHUYÊN DÙNG NỘI BỘ
- **Ưu điểm:** Web chạy 24/7 không bao giờ ngủ đông, mở lên tức thì. Gánh mượt mà 100 – 150 KTV thi cùng lúc. Chi phí cực kỳ rẻ (~170k/tháng).
- **Nhược điểm:** Băng thông vẫn nằm trong định mức cơ bản, nếu vượt mức cần chú ý theo dõi.
- **Phù hợp:** Phục vụ sát hạch thường xuyên cho chi nhánh/trung tâm với chi phí tối thiểu.

### 🔵 Phương án 3: Nâng cấp Gói Pro Workspace ($25/tháng ~ 600.000 VNĐ/tháng) — CHUẨN DOANH NGHIỆP
- **Ưu điểm:** An toàn tuyệt đối, web không bao giờ bị khóa đột ngột. Cấp sẵn 25 GB băng thông (> 50.000 lượt thi). Hỗ trợ chạy không giới hạn số lượng dự án web. **Có hóa đơn PDF chính thức ghi rõ Tên Công ty Cổ phần Viễn thông FPT và Mã số thuế để phòng Kế toán hoàn ứng 100% ngân sách.**
- **Nhược điểm:** Cần làm thủ tục duyệt chi và thanh toán định kỳ hàng tháng.
- **Phù hợp:** Định hướng chuẩn hóa hệ thống đào tạo dài hạn của FPT Telecom.

---

**Kính nhờ Anh Khoa và Anh Xanh xem xét và cho team em xin ý kiến định hướng để team triển khai phương án phù hợp nhất ạ!**
