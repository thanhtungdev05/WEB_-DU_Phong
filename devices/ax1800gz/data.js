/**
 * devices/ax1800gz/data.js — Cấu hình chung cho AX1800GZ (ZTE F6600)
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/ax1800gz/lessons/ (bai1.js .. bai6.js)
 */

window.DEVICE_AX1800GZ = {
  id: 'ax1800gz',
  name: 'ONT AX1800GZ',
  shortName: 'AX1800GZ',
  brand: 'FPT Telecom',
  model: 'ZTE F6600',
  firmware: 'V9.0.11P2N15B',
  port: 8086,
  folder: 'sim_ax1800gz',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_ax1800gz/login',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AX1800GZ_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AX1800GZ để tương thích với popup engine
if (!window.TOOLTIPS_AX1800GZ) window.TOOLTIPS_AX1800GZ = {};
if (window.DEVICE_AX1800GZ_LESSONS) {
  window.DEVICE_AX1800GZ_LESSONS.forEach(function (lesson) {
    if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_AX1800GZ[lesson.id] = lesson.guidePopups;
    } else if (window.TOOLTIPS_AX1800GZ[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_AX1800GZ[lesson.id];
    }
  });
}
