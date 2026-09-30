/**
 * devices/ax3000gz/lessons/bai1.js
 * Bài 1: Cấu hình PPPoE trên AX3000GZ
 */

window.DEVICE_AX3000GZ_LESSONS = window.DEVICE_AX3000GZ_LESSONS || [];

// Remove any existing LAB_AX3000GZ_01
var index = window.DEVICE_AX3000GZ_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000GZ_01'; });
if (index !== -1) {
  window.DEVICE_AX3000GZ_LESSONS.splice(index, 1);
}

window.DEVICE_AX3000GZ_LESSONS.push({
  id: 'LAB_AX3000GZ_01',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình kết nối WAN/Internet trên thiết bị và thiết lập kết nối PPPoE theo các thông số được cung cấp dưới đây:',
    '- Username: <span class="val">sgfdl-123456-789</span>',
    '- Password: <span class="val">fpt12345</span>'
  ],
  practiceUrl: '/sim_ax3000gz/cgi-bin/luci/admin/internet/wan', // LuCI based path usually, or we can just start at home
  clearFields: [
    '[id="widget.cbid.network.wan.username"]',
    '[id="widget.cbid.network.wan.password"]'
  ],
  grading: {
    description: 'Kiểm tra thông số Username và Password PPPoE',
    rules: [
      {
        id: 'pppoe_user',
        name: 'Username',
        selector: '[id="widget.cbid.network.wan.username"], [name="cbid.network.wan.username"]',
        expected: 'sgfdl-123456-789',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pppoe_pwd',
        name: 'Password',
        selector: '[id="widget.cbid.network.wan.password"], [name="cbid.network.wan.password"]',
        expected: 'fpt12345',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '#topmenu a[href*="internet"]',
      text: 'Bước 1: Chọn Internet',
      position: 'bottom',
      page: 'home'
    },
    {
      selector: '#WANUrl, #sidebarmenu a[href*="/internet/wan"]',
      text: 'Bước 2: Chọn WAN',
      position: 'right',
      hideOnPage: 'wan'
    },
    {
      selector: '[id="widget.cbid.network.wan.username"], [name="cbid.network.wan.username"]',
      text: 'Bước 3: Nhập Username: sgfdl-123456-789',
      position: 'right',
      page: 'wan'
    },
    {
      selector: '[id="widget.cbid.network.wan.password"], [name="cbid.network.wan.password"]',
      text: 'Bước 4: Nhập Password: fpt12345',
      position: 'right',
      page: 'wan'
    },
    {
      selector: '.cbi-button-save',
      text: 'Bước 5: Chọn Apply',
      position: 'bottom',
      page: 'wan'
    }
  ]
});
