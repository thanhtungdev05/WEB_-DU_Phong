/**
 * devices/ac1000f/data.js — Cấu hình chung cho ONT AC1000F
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/ac1000f/lessons/ (bai1.js .. bai10.js)
 */

window.DEVICE_AC1000F = {
  id: 'ac1000f',
  name: 'ONT AC1000F',
  shortName: 'AC1000F',
  port: 8080,
  folder: 'sim_ac1000f',
  serverBat: 'Chay-server-8081.bat',
  needsServer: false,
  loginUrl: '/sim_ac1000f/cgi-bin/login.asp',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AC1000F_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AC1000F để tương thích với popup engine
if (!window.TOOLTIPS_AC1000F) window.TOOLTIPS_AC1000F = {};
if (window.DEVICE_AC1000F_LESSONS) {
  window.DEVICE_AC1000F_LESSONS.forEach(lesson => {
    if (lesson.guidePopups) {
      window.TOOLTIPS_AC1000F[lesson.id] = lesson.guidePopups;
    } else if (window.TOOLTIPS_AC1000F && window.TOOLTIPS_AC1000F[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_AC1000F[lesson.id];
    }
  });
}
