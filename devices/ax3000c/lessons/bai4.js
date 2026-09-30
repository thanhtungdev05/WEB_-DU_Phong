/**
 * devices/ax3000c/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên AX3000CV2 (firmware 0.5.3)
 * "Define custom servers" là radio: value "1" = Enable, "0" = Disable.
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình DNS trên thiết bị và cấu hình các máy chủ DNS theo yêu cầu sau:',
    '- DNS Server 1: <span class="val">210.245.31.220</span> (DNS của FPT)',
    '- DNS Server 2: <span class="val">8.8.8.8</span> (DNS của Google)',
    '<i>Gợi ý IP DNS FPT: 210.245.31.220, 210.245.31.221, 210.31.1.253, 210.31.1.254</i>',
    '<i>Gợi ý IP DNS Google: 8.8.8.8, 8.8.4.4</i>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/lan',
  customClear: function () {
    FTC_AX3000C.xoaO([FTC_AX3000C.o('DNS Server 1'), FTC_AX3000C.o('DNS Server 2')]);
  },
  grading: {
    description: 'Kiểm tra cấu hình DNS Server trên AX3000CV2',
    rules: [
      {
        id: 'dns_custom_enable',
        name: 'Define custom servers',
        selector: '.el-form-item[data-ftc-nhan="Define custom servers"] .el-radio.is-checked input',
        expected: '1',
        valueLabels: { '1': 'Enable', '0': 'Disable' },
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_server_1',
        name: 'DNS Server 1',
        selector: FTC_AX3000C.o('DNS Server 1'),
        expected: '210.245.31.220',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_server_2',
        name: 'DNS Server 2',
        selector: FTC_AX3000C.o('DNS Server 2'),
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_04']
});
