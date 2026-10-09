/**
 * devices/ax3000s/data.js — Cấu hình chung cho AX3000S
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/ax3000s/lessons/ (bai1.js .. bai7.js)
 */

window.DEVICE_AX3000S = {
  id: 'ax3000s',
  name: 'ONT AX3000S',
  shortName: 'AX3000S',
  port: 8080,
  folder: 'sim_ax3000s',
  serverBat: 'Chay-server-8098.bat',
  needsServer: false,
  loginUrl: '/sim_ax3000s/login.html',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AX3000S_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AX3000S để tương thích với popup engine
if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};
if (window.DEVICE_AX3000S_LESSONS) {
  window.DEVICE_AX3000S_LESSONS.forEach(lesson => {
    if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_AX3000S[lesson.id] = lesson.guidePopups;
    } else if (window.TOOLTIPS_AX3000S[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_AX3000S[lesson.id];
    }
  });
}
