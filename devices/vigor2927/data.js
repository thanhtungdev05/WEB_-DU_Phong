/**
 * devices/vigor2927/data.js — Cấu hình chung cho Vigor2927
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/vigor2927/lessons/ (bai1.js)
 */

window.DEVICE_VIGOR2927 = {
  id: 'vigor2927',
  name: 'DrayTek Vigor2927',
  shortName: 'Vigor2927',
  port: 8080,
  folder: 'sim_vigor2927',
  serverBat: 'Chay-server.bat',
  needsServer: false,
  loginUrl: '/sim_vigor2927/weblogin.htm',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_VIGOR2927_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_VIGOR2927 để tương thích với popup engine
if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};
if (window.DEVICE_VIGOR2927_LESSONS) {
  window.DEVICE_VIGOR2927_LESSONS.forEach(lesson => {
    if (window.TOOLTIPS_VIGOR2927[lesson.id] && window.TOOLTIPS_VIGOR2927[lesson.id].length > 0) {
      lesson.guidePopups = window.TOOLTIPS_VIGOR2927[lesson.id];
    } else if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_VIGOR2927[lesson.id] = lesson.guidePopups;
    }
  });
}
