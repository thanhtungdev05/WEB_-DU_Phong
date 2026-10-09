/**
 * devices/be12000/data.js — Cấu hình chung cho BE12000 (ZTE F8728D)
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/be12000/lessons/ (bai1.js .. bai7.js)
 */

window.DEVICE_BE12000 = {
  id: 'be12000',
  name: 'ONT BE1200Z',
  shortName: 'BE12000',
  port: 8080,
  folder: 'sim_be12000',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_be12000/login',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_BE12000_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_BE12000 để tương thích với popup engine
if (!window.TOOLTIPS_BE12000) window.TOOLTIPS_BE12000 = {};
if (window.DEVICE_BE12000_LESSONS) {
  window.DEVICE_BE12000_LESSONS.forEach(lesson => {
    if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_BE12000[lesson.id] = lesson.guidePopups;
    } else if (window.TOOLTIPS_BE12000[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_BE12000[lesson.id];
    }
  });
}
