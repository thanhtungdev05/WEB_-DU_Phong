/**
 * devices/ax3000c/lessons/bai5.js
 * Bài 5: Cấu hình DHCP (đổi IP LAN) trên AX3000CV2 (firmware 0.5.3)
 * Mở bài thì giả lập đặt IP LAN về 192.168.1.1 (như bản cũ). Sửa IP rồi rời ô thì
 * firmware 0.5.3 tự nhảy dải DHCP thành .2 -> .254 — đáp án end = .249 (anh Huynn sửa lại
 * 2026-09-26, trước đó chốt nhầm .254).
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện thay đổi cấu hình địa chỉ IP LAN trên thiết bị theo các thông số được cung cấp dưới đây.',
    '- Router LAN IPv4 Address: <span class="val">192.168.100.1</span>',
    '- Subnet mask: <span class="val">255.255.255.0</span>',
    '- DHCP start address: <span class="val">192.168.100.2</span>',
    '- DHCP end address: <span class="val">192.168.100.249</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/lan',
  onSimLoad: function (simWin) { FTC_AX3000C.datTrangThaiBai(simWin, 5); },
  grading: {
    description: 'Kiểm tra IP LAN và dải DHCP Pool trên AX3000CV2',
    rules: [
      {
        id: 'lan_ip',
        name: 'Router LAN IP Address',
        selector: FTC_AX3000C.o('Router LAN IPv4 Address'),
        expected: '192.168.100.1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'subnet_mask',
        name: 'Subnet Mask',
        selector: FTC_AX3000C.o('Subnet mask'),
        expected: '255.255.255.0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_start',
        name: 'DHCP Start Address',
        selector: FTC_AX3000C.o('DHCP start address'),
        expected: '192.168.100.2',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_end',
        name: 'DHCP End Address',
        selector: FTC_AX3000C.o('DHCP end address'),
        expected: '192.168.100.249',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05']
});
