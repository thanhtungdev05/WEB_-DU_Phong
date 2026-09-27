/**
 * devices/ac1000HI/lessons/bai10.js
 * Bài 10: Cấu hình chặn Web
 */

window.DEVICE_AC1000HI_LESSONS = window.DEVICE_AC1000HI_LESSONS || [];

window.DEVICE_AC1000HI_LESSONS.push({
  id: 'LAB_AC1000HI_10',
  title: 'Bài 10 - Cấu hình chặn Web',
  subtitle: 'Thiết lập quy tắc lọc và chặn truy cập Web',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Filter Type: <span class="val">URL Filter</span>',
    '- URL Index: <span class="val">1</span>',
    '- URL (Host): <span class="val">facebook.com</span>'
  ],
  practiceUrl: '/sim_ac1000HI/cgi-bin/index.asp?page=access_ipfilter.asp',

  // Ràng buộc điều kiện chấm đúng Ä‘Ãºng
    grading: { rules: [] }
});



