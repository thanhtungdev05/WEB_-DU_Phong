/**
 * devices/ax3000s/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

const lessonObj6 = {
  id: 'LAB_AX3000S_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây:',
    '- Tên dịch vụ: <span class="val">NAT FPT</span>',
    '- External Port: <span class="val">8080</span>',
    '- Internal IP: <span class="val">192.168.1.100</span>',
    '- Internal Port: <span class="val">8080</span>',
    '- Protocol: <span class="val">TCP/UDP</span>',
    '- Lease Duration: <span class="val">0</span>'
  ],
  practiceUrl: '/sim_ax3000s/app.html#portforward',
  clearFields: [
    '#cusSrvName',
    '#sIp',
    '#ex_port',
    '#in_port'
  ],
  grading: {
    description: 'Kiểm tra cấu hình Port Forwarding',
    rules: [
      {
        id: 'pf_enable',
        name: 'Enable',
        selector: '#enableVir',
        expected: ['1', 'on', 'true', 'ON'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'pf_name',
        name: 'Tên dịch vụ',
        selector: '#cusSrvName',
        expected: 'NAT FPT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_internal_ip',
        name: 'Internal IP',
        selector: '#sIp',
        expected: '192.168.1.100',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_lease',
        name: 'Lease Duration',
        selector: '#leasetime',
        expected: '0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_proto',
        name: 'Protocol',
        selector: '#Proto',
        expected: '0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_ext_port',
        name: 'External Port',
        selector: '#ex_port',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_int_port',
        name: 'Internal Port',
        selector: '#in_port',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000S && window.TOOLTIPS_AX3000S['LAB_AX3000S_06']) || []
};

const existingIndex6 = window.DEVICE_AX3000S_LESSONS.findIndex(l => l.id === 'LAB_AX3000S_06');
if (existingIndex6 !== -1) {
  window.DEVICE_AX3000S_LESSONS[existingIndex6] = lessonObj6;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj6);
}
