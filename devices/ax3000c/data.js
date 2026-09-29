/**
 * devices/ax3000c/data.js — Cấu hình chung cho AX3000C (thiết bị AX3000CV2, firmware 0.5.3)
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/ax3000c/lessons/ (bai1.js .. bai7.js)
 * Giả lập: simulators/sim_ax3000c/server_fw053.py (giữ id 'ax3000c' và URL /sim_ax3000c/ như cũ)
 */

window.DEVICE_AX3000C = {
  id: 'ax3000c',
  name: 'ONT AX3000CV2',
  shortName: 'AX3000CV2',
  port: 8080,
  folder: 'sim_ax3000c',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_ax3000c/#/login',
  resetSessionUrl: '/sim_ax3000c/sim-reset-session',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AX3000C_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AX3000C để tương thích với popup engine
if (!window.TOOLTIPS_AX3000C) window.TOOLTIPS_AX3000C = {};
if (window.DEVICE_AX3000C_LESSONS) {
  window.DEVICE_AX3000C_LESSONS.forEach(lesson => {
    if (lesson.guidePopups) {
      window.TOOLTIPS_AX3000C[lesson.id] = lesson.guidePopups;
    }
  });
}
