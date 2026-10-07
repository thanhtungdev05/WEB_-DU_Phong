/**
 * devices/ax3000s/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

const lessonObj4 = {
  id: 'LAB_AX3000S_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">210.245.31.220</span>',
    '- Secondary DNS: <span class="val">8.8.8.8</span>'
  ],
  practiceUrl: '/sim_ax3000s/app.html#lancfgv4',
  clearFields: [
    '#dnsPrimary',
    '#dnsSecondary'
  ],
  grading: {
    description: 'Kiểm tra cấu hình máy chủ DNS',
    rules: [
      {
        id: 'dns_mode',
        name: 'IPv4 DNS Mode',
        selector: '#dnsmode2',
        expected: ['1', 'on', 'true', 'ON'],
        type: 'any_of',
        trim: true,
        required: true,
        errorMessage: 'Bạn cần chọn chế độ DNS là Static'
      },
      {
        id: 'dns_primary',
        name: 'Primary DNS',
        selector: '#dnsPrimary',
        expected: '210.245.31.220',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_secondary',
        name: 'Secondary DNS',
        selector: '#dnsSecondary',
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000S && window.TOOLTIPS_AX3000S['LAB_AX3000S_04']) || []
};

const existingIndex4 = window.DEVICE_AX3000S_LESSONS.findIndex(l => l.id === 'LAB_AX3000S_04');
if (existingIndex4 !== -1) {
  window.DEVICE_AX3000S_LESSONS[existingIndex4] = lessonObj4;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj4);
}
