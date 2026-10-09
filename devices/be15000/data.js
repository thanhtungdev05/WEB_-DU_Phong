/**
 * devices/be15000/data.js — Cấu hình chung cho BE15000
 * Bài học chi tiết: devices/be15000/lessons/bai1.js (Xem thiết bị AP BE1500)
 */

window.DEVICE_BE15000 = {
  id: 'be15000',
  name: 'AP BE1500Z',
  shortName: 'BE15000',
  type: 'AP',
  port: 8080,
  folder: 'sim_be15000',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_be15000/login',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_BE15000_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_BE15000 để tương thích với popup engine
if (!window.TOOLTIPS_BE15000) window.TOOLTIPS_BE15000 = {};
if (window.DEVICE_BE15000_LESSONS) {
  window.DEVICE_BE15000_LESSONS.forEach(lesson => {
    if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_BE15000[lesson.id] = lesson.guidePopups;
    }
  });
}
