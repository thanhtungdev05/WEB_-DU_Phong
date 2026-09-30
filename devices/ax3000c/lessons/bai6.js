/**
 * devices/ax3000c/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AX3000CV2 (firmware 0.5.3)
 * Firmware 0.5.3 không có cột Rule Name -> anh Huynn chọn bỏ, thêm tiêu chí Enable (2026-09-26).
 * Dòng mới do Add tạo có Enable TẮT (mã firmware) -> học viên phải tự bật (anh Huynn chốt).
 * Công tắc Enable: bật -> "on", tắt -> "false" (cách bộ chấm đọc checkbox).
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây.',
    '- Enable: <span class="val">Bật</span>',
    '- Protocol: <span class="val">TCP+UDP</span>',
    '- External Port: <span class="val">8080</span>',
    '- Device/IP: <span class="val">Admin-PC (192.168.100.109 / d8:43:ae:2e:65:45)</span>',
    '- Internal Port: <span class="val">80</span>'
  ],
  practiceUrl: '/sim_ax3000c/#/network/portfwd',
  grading: {
    description: 'Kiểm tra Port Forwarding Rules trên AX3000CV2',
    rules: [
      {
        id: 'enable',
        name: 'Enable',
        selector: FTC_AX3000C.cot('Enable'),
        expected: 'on',
        valueLabels: { 'on': 'Bật', 'false': 'Tắt' },
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'protocol',
        name: 'Protocol',
        selector: FTC_AX3000C.cot('Protocol'),
        expected: 'TCP+UDP',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'ext_port',
        name: 'External Port',
        selector: FTC_AX3000C.cot('External port'),
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'int_ip',
        name: 'Internal IP (Device/IP)',
        selector: FTC_AX3000C.cot('Device/IP'),
        // Đã đo: chọn Admin-PC thì ô chứa nguyên dòng này (trước và sau Apply), gửi dest_ip 192.168.100.109.
        // Anh Huynn chốt: gõ tay 192.168.100.109 cũng chấm ĐÚNG -> chấp nhận cả hai.
        expected: ['Admin-PC (192.168.100.109 / d8:43:ae:2e:65:45)', '192.168.100.109'],
        // any_of: bảng chấm hiện String(expected) (nối bằng dấu phẩy) -> đổi thành chữ dễ đọc
        valueLabels: {
          'Admin-PC (192.168.100.109 / d8:43:ae:2e:65:45),192.168.100.109':
            'Admin-PC (192.168.100.109 / d8:43:ae:2e:65:45) hoặc 192.168.100.109'
        },
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'int_port',
        name: 'Internal Port',
        selector: FTC_AX3000C.cot('Internal port'),
        expected: '80',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_06']
});
