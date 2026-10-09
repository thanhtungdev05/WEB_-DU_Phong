/**
 * devices/ac1000cv2/data.js — Cấu hình chung cho Internet Hub AC1000C V2 (G-97RG6W)
 */

window.DEVICE_AC1000CV2 = {
  id: 'ac1000cv2',
  name: 'ONT AC1000C V2',
  shortName: 'AC1000C V2',
  type: 'ONT',
  port: 8080,
  folder: 'sim_ac1000cv2',
  serverBat: 'Chay-server.bat',
  needsServer: false,
  loginUrl: '/sim_ac1000cv2/login.html',
  categories: [
    {
      title: 'HỌC TẬP',
      lessons: window.DEVICE_AC1000CV2_LESSONS || []
    }
  ]
};

// Đồng bộ Tooltips vào store toàn cục TOOLTIPS_AC1000CV2 và gán vào lesson.guidePopups
if (!window.TOOLTIPS_AC1000CV2) window.TOOLTIPS_AC1000CV2 = {};
if (window.DEVICE_AC1000CV2_LESSONS) {
  window.DEVICE_AC1000CV2_LESSONS.forEach(lesson => {
    if (window.TOOLTIPS_AC1000CV2 && window.TOOLTIPS_AC1000CV2[lesson.id]) {
      lesson.guidePopups = window.TOOLTIPS_AC1000CV2[lesson.id];
    } else if (lesson.guidePopups) {
      window.TOOLTIPS_AC1000CV2[lesson.id] = lesson.guidePopups;
    }
  });
}
