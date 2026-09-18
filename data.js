/**
 * data.js — Alias & Wrapper giữ tương thích cho Portal
 * Tất cả dữ liệu thiết bị và chấm thao tác chi tiết hiện được quản lý theo mô-đun trong thư mục devices/
 */

// devices/index.js là registry module duy nhất. Catalog từ API mới quyết định
// thiết bị/bài lab nào được hiển thị; không tự mở lại danh sách tĩnh khi lỗi.
if (!Array.isArray(window.DEVICES)) window.DEVICES = [];

if (!window.DEVICE_CONFLICT_PORTS) {
  window.DEVICE_CONFLICT_PORTS = {
    8080: ['ac1000f', 'ax3000hv2', 'ax3000s'],
  };
}
