# Quy ước và công thức dashboard

## Dữ liệu lịch sử Firebase v1

- Firebase v1 chỉ ghi log khi người dùng đã hoàn thành đạt yêu cầu. Log thực hành được nhập với `is_passed = TRUE`; log “có hướng dẫn” là phiên hướng dẫn hoàn thành và không có kết quả Đạt/Không đạt.
- Firebase v1 không lưu các lần thử thất bại. Vì vậy `attempt_sequence_complete = FALSE`, `completed_first_try = NULL` và dữ liệu này không tham gia mẫu số/tử số tỷ lệ đạt lần đầu.
- Tài khoản test, ADMIN/DEV và tài khoản legacy chưa có vùng được gom vào nhóm báo cáo `FTC`; việc phân nhóm này không cấp role KTV hoặc quyền đăng nhập.
- Bài/thiết bị lịch sử không khớp chắc chắn với portal được giữ bằng catalog bất hoạt. Chúng tham gia tổng lượt sử dụng lịch sử nhưng không mở rộng ma trận bài đang hoạt động.

Tài liệu này là hợp đồng nghiệp vụ dùng chung cho dashboard quản trị và dashboard cá nhân.

## 1. Quy ước dữ liệu

- **Phiên hợp lệ:** phiên không phải dữ liệu mock, đã kết thúc với trạng thái `completed` hoặc `failed`.
- **Phiên thực hành đã chấm:** phiên thực hành có `is_passed` khác `NULL`.
- **Phiên Đạt:** phiên thực hành có `is_passed = TRUE`. Trạng thái `completed` nhưng chưa có kết quả không được coi là Đạt.
- **Cặp KTV–bài:** một KTV và một bài lab được giao. Tổng các cặp này không phải số KTV duy nhất.
- **Hoàn thành bài:** cặp KTV–bài có ít nhất một phiên thực hành Đạt trong thời gian assignment có hiệu lực và không muộn hơn cuối kỳ báo cáo.
- **Làm tròn:** tỷ lệ API làm tròn tối đa hai chữ số thập phân; một số thẻ giao diện làm tròn số nguyên hoặc một chữ số để dễ đọc.
- **Không có mẫu số:** hiển thị `—`/`N/A`, không hiển thị `0%` như thể đã có dữ liệu.

## 2. Tổng quan quản trị

| Chỉ số | Công thức | Phạm vi |
|---|---|---|
| Lượt thực hành | Số phiên thực hành hợp lệ | Trong kỳ chọn |
| Lượt hướng dẫn | Số phiên hướng dẫn hợp lệ | Trong kỳ chọn |
| KTV tham gia | Số KTV duy nhất có ít nhất một phiên thực hành hoặc hướng dẫn | Trong kỳ chọn |
| Tỷ lệ phiên Đạt | Phiên thực hành Đạt / phiên thực hành đã chấm × 100 | Trong kỳ chọn |
| Chênh lệch số lượng | Giá trị kỳ này − kỳ trước | Hai kỳ liền nhau |
| % thay đổi số lượng | Chênh lệch / kỳ trước × 100 | Chỉ tính khi kỳ trước lớn hơn 0; kỳ trước bằng 0 hiển thị chênh lệch tuyệt đối |
| Chênh lệch tỷ lệ | Tỷ lệ kỳ này − tỷ lệ kỳ trước | Hiển thị bằng điểm phần trăm |

`completed` nhưng `is_passed = NULL` được thông báo là “đã hoàn thành thao tác nhưng chưa có kết quả”, không đưa vào tử số hoặc mẫu số tỷ lệ phiên Đạt.

## 3. Biểu đồ tổng quan

- **Tỷ lệ KTV thực hành đạt theo khu vực:** số KTV hiện thuộc khu vực có ít nhất một phiên Đạt trong tháng / quân số KTV đã đăng nhập của khu vực × 100. Mẫu số chỉ tính KTV đang hoạt động đã từng đăng nhập vào hệ thống (hoặc có phát sinh phiên làm bài), không tính nhân sự chưa từng đăng nhập; quy về cơ cấu khu vực hiện tại. Báo cáo snapshot lịch sử toàn bộ danh mục nhân sự nằm ở ma trận khu vực.
- **Thi đua khu vực:** tổng phiên thực hành trong năm / quân số KTV đã đăng nhập của khu vực.
- **Xu hướng lượt thực hành tháng:** tổng phiên thực hành của tháng. “Đạt” đi kèm là số phiên Đạt, không phải số bài hoàn thành.
- **Hoạt động theo giờ:** số phiên hợp lệ có thời điểm bắt đầu thuộc từng khung hai giờ.
- **Phân bố thiết bị:** số phiên của thiết bị / tổng phiên của KTV × 100.

## 4. Báo cáo khu vực và chi nhánh

- **Phạm vi KTV:** toàn bộ KTV đang hoạt động theo khu vực và chi nhánh hiện tại trong danh mục nhân sự; không yêu cầu enrollment hoặc assignment.
- **Phạm vi phiên:** mọi phiên hợp lệ của KTV trong phạm vi, kể cả phiên không liên kết assignment.
- **Ô khu vực/chi nhánh theo bài:** KTV đã có ít nhất một phiên Đạt của bài đến cuối kỳ / toàn bộ KTV đang hoạt động tại khu vực hoặc chi nhánh × 100.
- **Đã thực hành:** số KTV đang hoạt động có ít nhất một phiên thực hành của bài trong kỳ.
- **Lượt thực hành:** số phiên thực hành trong kỳ.
- **Kết quả hoàn thành:** lũy kế đến hết ngày cuối kỳ.
- **Cột Tổng/Tổng hệ thống:** tổng số cặp KTV–bài đã đạt / tổng số cặp `KTV đang hoạt động × bài đang hoạt động`. Một KTV được tính một lần cho mỗi bài.
- **Ma trận KTV của chi nhánh:** số phiên Đạt / toàn bộ phiên thực hành của KTV cho bài đó trong kỳ × 100. Phiên chưa chấm nằm trong mẫu số vì ô này mô tả hiệu suất trên mọi lượt thực hành.
- **Nguồn vị trí:** khu vực/chi nhánh hiện tại của KTV; đây không phải snapshot vị trí lịch sử tại thời điểm phát sinh phiên.
- **Không tải được danh mục KTV:** để trống, không tự dựng tỷ lệ từ dữ liệu phía trình duyệt.

## 5. Báo cáo lớp

- **Sĩ số lớp:** toàn bộ enrollment đang hoạt động, kể cả KTV chưa có bài được giao.
- **Ô KTV–bài:** số phiên Đạt / toàn bộ phiên thực hành được liên kết với đúng assignment của lớp đó.
- **Bài đã đạt / được giao:** số assignment có trạng thái `passed` / số assignment của KTV trong phạm vi thiết bị đang xem.
- **Tỷ lệ hoàn thành của KTV:** bài đã đạt / bài được giao × 100.
- **Footer từng bài:** KTV hoàn thành assignment của bài / KTV thực sự được giao bài × 100; KTV không được giao không nằm trong mẫu số.
- **KTV hoàn thành toàn bộ bài:** KTV đã đạt tất cả assignment của mình / KTV trong phạm vi bộ lọc × 100.
- **KTV hoàn thành theo thiết bị:** KTV đạt tất cả assignment của thiết bị / KTV trong phạm vi bộ lọc có/không có assignment; KTV không có assignment không được tính hoàn thành.
- **Lượt thực hành của lớp:** chỉ gồm phiên có liên kết assignment với đúng lớp; phiên từng làm ở lớp khác không được cộng.

## 6. Danh sách và chi tiết KTV quản trị

- **Số lượt:** tổng phiên thực hành và hướng dẫn của KTV trong phạm vi bộ lọc.
- **% phiên thực hành đạt:** phiên Đạt / toàn bộ phiên thực hành × 100. Phiên hướng dẫn không nằm trong mẫu số.
- **Bài đã thực hành:** số bài được giao có ít nhất một phiên thực hành / tổng bài được giao.
- **Thiết bị đã thực hành:** số thiết bị được giao có ít nhất một phiên thực hành / tổng thiết bị được giao.
- **Số lần thực hành:** ưu tiên `practice_attempt_no`; khi dữ liệu cũ thiếu số lần, giao diện đánh số theo thứ tự thời gian trong cùng KTV–thiết bị–bài.

## 7. Dashboard cá nhân

| Chỉ số | Công thức |
|---|---|
| Tiến độ bài học | Assignment đã đạt / tổng assignment đang thuộc phạm vi học tập × 100 |
| Đạt ngay lần 1 | Assignment có lần Đạt đầu tiên là lần 1 / assignment đã đạt có dữ liệu số lần × 100 |
| Tỷ lệ phiên Đạt | Phiên thực hành Đạt / phiên thực hành đã chấm × 100 |
| Thời gian luyện tập | Tổng `duration_sec` của toàn bộ phiên thực hành hợp lệ |
| Đang thực hiện | Assignment có trạng thái `in_progress` |
| Chưa bắt đầu | Tổng assignment − đã đạt − đang thực hiện |
| Tiến độ thiết bị | Assignment của thiết bị đã đạt / tổng assignment của thiết bị × 100 |
| Xu hướng 14 ngày | Tỷ lệ phiên Đạt theo 14 ngày lịch liên tiếp gần nhất; ngày không có phiên đã chấm hiển thị N/A |
| Tần suất theo tháng | Tổng phiên mỗi ngày từ dữ liệu tổng hợp toàn lịch sử |

KPI cá nhân và biểu đồ ngày được tổng hợp trên toàn bộ lịch sử. Danh sách chi tiết chỉ trả tối đa 500 phiên gần nhất để bảo vệ kích thước phản hồi; giao diện ghi rõ khi danh sách đã bị cắt.
