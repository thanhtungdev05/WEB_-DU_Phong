/**
 * devices/vigor2927/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE trên DrayTek Vigor2927
 */

window.DEVICE_VIGOR2927_LESSONS = window.DEVICE_VIGOR2927_LESSONS || [];

window.DEVICE_VIGOR2927_LESSONS.push({
  id: 'vg2927-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình kết nối WAN/Internet trên thiết bị DrayTek Vigor2927 theo chế độ PPPoE với các thông số sau:',
    '- Username: <span class="val">sgfdl-211208-218</span>',
    '- Password: <span class="val">12345678</span>',
  ],
  practiceUrl: '/sim_vigor2927/weblogin.htm',

  // Xóa trắng các ô nhập liệu khi bài lab mở
  clearFields: [
    '#opt-pppoe-username',
    'input[name="sDOutUser1"]',
    '#opt-pppoe-password',
    'input[name="sDOutPass1"]'
  ],

  // Ràng buộc điều kiện chấm đúng (3 tiêu chí)
  grading: {
    description: 'Kiểm tra cấu hình PPPoE trên DrayTek Vigor2927',
    rules: [
      {
        id: 'opt_pppoe_mode',
        name: 'PPPoE Mode',
        selector: 'input[name="PPPoE"]:checked',
        expected: '1',
        // Đo thật trên thiết bị (radio value="1" = "Enable", value="0" = "Disable"
        // — xem HTML gốc `mwpvcvlan_clkid-108.html`): bảng "Xem lỗi sai" trước đây
        // hiện thẳng giá trị thô "1"/"0" thay vì chữ học viên nhìn thấy trên màn
        // hình, dễ gây hiểu nhầm (anh Huynn báo 2026-09-23). `valueLabels` đổi
        // giá trị thô sang đúng chữ hiển thị khi in ra bảng kết quả.
        valueLabels: { '1': 'Enable', '0': 'Disable' },
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'opt_pppoe_username',
        name: 'PPPoE Username',
        selector: '#opt-pppoe-username, input[name="sDOutUser1"]',
        expected: 'sgfdl-211208-218',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'opt_pppoe_password',
        name: 'PPPoE Password',
        selector: '#opt-pppoe-password, input[name="sDOutPass1"]',
        expected: '12345678',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_VIGOR2927 && window.TOOLTIPS_VIGOR2927['vg2927-bai1']) || [
    {
      selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
      text: 'Bước 1: chọn WAN',
      position: 'bottom'
    },
    {
      selector: '#sub-wan:not(.hidden) #menu-wan-internet .menu-text, #sub-wan:not(.hidden) #menu-wan-internet',
      text: 'Bước 2: chọn Internet Access',
      position: 'bottom'
    },
    {
      selector: 'input[name="btnDtPage0"], input[value="Details Page"]',
      text: 'Bước 3: Chọn Details Page',
      position: 'top'
    },
    {
      selector: '#tab1.offtab, #tab1:not(.ontab)',
      text: 'Bước 4: chọn PPPoE',
      position: 'bottom'
    },
    {
      selector: '#lbl-pppoe-disable, input[name="PPPoE"][value="0"]',
      text: 'Bước 5: chọn Enable',
      position: 'right',
      expected: '1'
    },
    {
      selector: '#opt-pppoe-username, input[name="sDOutUser1"]',
      text: 'Bước 6: nhập sgfdl-211208-218',
      position: 'right',
      expected: 'sgfdl-211208-218'
    },
    {
      selector: '#opt-pppoe-password, input[name="sDOutPass1"]',
      text: 'Bước 7: nhập 12345678',
      position: 'right',
      expected: '12345678'
    },
    {
      selector: '#btn-pppoe-ok, input[name="submit"][value="OK"], input[type="submit"][value="OK"]',
      text: 'Bước 8: nhấn OK',
      position: 'top'
    }
  ]
});
