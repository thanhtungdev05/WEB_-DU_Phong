/**
 * devices/ax3000gz/data.js — Cấu hình chung cho AX3000GZ
 * Các bài học chi tiết được quản lý độc lập trong thư mục devices/ax3000gz/lessons/ (bai1.js .. bai9.js)
 */

window.DEVICE_AX3000GZ = {
  id: 'ax3000gz',
  name: 'ONT AX3000GZ',
  shortName: 'AX3000GZ',
  port: 8080,
  folder: 'sim_ax3000gz',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_ax3000gz/cgi-bin/luci/login',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AX3000GZ_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AX3000GZ để tương thích với popup engine
if (!window.TOOLTIPS_AX3000GZ) window.TOOLTIPS_AX3000GZ = {};
if (window.DEVICE_AX3000GZ_LESSONS) {
  window.DEVICE_AX3000GZ_LESSONS.forEach(lesson => {
    if (lesson.guidePopups && lesson.guidePopups.length > 0) {
      window.TOOLTIPS_AX3000GZ[lesson.id] = lesson.guidePopups;
    } else if (window.TOOLTIPS_AX3000GZ && window.TOOLTIPS_AX3000GZ[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_AX3000GZ[lesson.id];
    }
  });
}
