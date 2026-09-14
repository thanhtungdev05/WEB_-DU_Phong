/**
 * devices/ax3000c/lessons/bai3.js
 * Bài 3: Cấu hình WiFi IoT trên AX3000C
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

var idx = window.DEVICE_AX3000C_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000CV2_03'; });
var lessonObj = {
  id: 'LAB_AX3000CV2_03',
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình một mạng Wi-Fi riêng biệt dành riêng cho các thiết bị IoT tại tab <b>Specific SSID</b> theo đúng yêu cầu dưới đây:',
    '- Tab Wi-Fi: <span class="val">Specific SSID</span>',
    '- SSID Name: <span class="val">FPT IoT</span>',
    '- WPA Key: <span class="val">fptiot123</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/wifi',
  clearFields: [
    '.card .row input[type="text"]',
    '#pp'
  ],
  grading: {
    description: 'Kiểm tra SSID và WPA Key tại tab Specific SSID trên AX3000C',
    rules: [
      {
        id: 'wifi_tab',
        name: 'Chọn tab Specific SSID',
        selector: '.tab.active[data-t="specific"], .tab.active:contains("Specific SSID")',
        expected: 'Specific SSID',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_ssid',
        name: 'Tên Wi-Fi IoT (SSID)',
        selector: '.card .row input[type="text"], input[value*="FPT"]',
        expected: 'FPT IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wifi_key',
        name: 'Mật khẩu Wi-Fi IoT (WPA Key)',
        selector: '#pp, input[type="password"]',
        expected: 'fptiot123',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].URL.toLowerCase().indexOf('wifi.html') !== -1 || allDocs[i].querySelector('.tab[data-t="specific"]')) {
          doc = allDocs[i];
          break;
        }
      }

      function getVal(selector) {
        if (!doc) return '';
        try {
          var el = doc.querySelector(selector);
          if (el) return (el.value || el.textContent || '').trim();
        } catch (e) { }
        return '';
      }

      var activeTab = doc ? doc.querySelector('.tab.active') : null;
      var activeTabKey = activeTab ? activeTab.getAttribute('data-t') : '';
      var activeTabName = activeTab ? activeTab.textContent.trim() : '(Chưa chọn)';

      var ssidVal = getVal('.card .row input[type="text"]');
      var passVal = getVal('#pp');
      var isSaved = doc ? !!doc._ftcIsSaved : false;

      var tabMatch = (activeTabKey === 'specific');
      var ssidMatch = (ssidVal === 'FPT IoT');
      var passMatch = (passVal === 'fptiot123');
      var saveMatch = isSaved;

      var rules = [
        {
          id: '1',
          name: 'Chọn tab Wi-Fi IoT',
          expected: 'Specific SSID',
          actual: activeTabName,
          passed: tabMatch,
          message: tabMatch ? 'Chính xác' : 'Cần chuyển sang tab Specific SSID'
        },
        {
          id: '2',
          name: 'Tên Wi-Fi IoT (SSID)',
          expected: 'FPT IoT',
          actual: ssidVal || '(Trống)',
          passed: ssidMatch,
          message: ssidMatch ? 'Chính xác' : 'Mong muốn: "FPT IoT", Thực tế: "' + (ssidVal || 'Trống') + '"'
        },
        {
          id: '3',
          name: 'Mật khẩu Wi-Fi IoT',
          expected: 'fptiot123',
          actual: passVal || '(Trống)',
          passed: passMatch,
          message: passMatch ? 'Chính xác' : 'Mong muốn: "fptiot123", Thực tế: "' + (passVal || 'Trống') + '"'
        },
        {
          id: '4',
          name: 'Lưu cấu hình',
          expected: 'Đã nhấn Apply',
          actual: isSaved ? 'Đã nhấn Apply' : 'Chưa nhấn Apply',
          passed: saveMatch,
          message: saveMatch ? 'Chính xác' : 'Vui lòng nhấn nút Apply để lưu cấu hình'
        }
      ];

      var passedCount = rules.filter(function (r) { return r.passed; }).length;
      return {
        passed: passedCount === rules.length,
        score: Math.round((passedCount / rules.length) * 100),
        passedCount: passedCount,
        totalRules: rules.length,
        details: rules
      };
    }
  },
  guidePopups: (window.TOOLTIPS_AX3000C && window.TOOLTIPS_AX3000C['LAB_AX3000CV2_03']) ? window.TOOLTIPS_AX3000C['LAB_AX3000CV2_03'] : [
    {
      selector: '.el-submenu__title:contains("Network"), .el-submenu:contains("Network")',
      text: 'Chọn Network',
      position: 'right',
      hideOnPage: 'wifi'
    },
    {
      selector: '.el-submenu:contains("Network") .el-submenu__title:contains("Wi-Fi"), .el-submenu:contains("Network") .el-submenu__title:contains("WIFI")',
      text: 'Chọn WIFI',
      position: 'right',
      hideOnPage: 'wifi'
    },
    {
      selector: '.el-menu-item:contains("Wi-Fi"), .el-menu-item:contains("WIFI"), .el-menu-item[index*="/network/wifi"]',
      text: 'Chọn WIFI',
      position: 'right',
      hideOnPage: 'wifi'
    },
    {
      selector: '.tab[data-t="specific"]',
      text: 'Bước 1: chọn tab Specific SSID',
      position: 'top',
      page: 'wifi'
    },
    {
      selector: 'body[data-active-tab="specific"] .card .row input[type="text"], .tabs:has(.tab.active[data-t="specific"]) ~ .card .row input[type="text"]',
      text: 'Bước 2: đặt tên WIFI IoT ví dụ: FPT IoT',
      position: 'right',
      expected: 'FPT IoT',
      page: 'wifi'
    },
    {
      selector: 'body[data-active-tab="specific"] .card #pp, .tabs:has(.tab.active[data-t="specific"]) ~ .card #pp',
      text: 'Bước 3: đặt mật khẩu WIFI IoT ví dụ: fptiot123',
      position: 'right',
      expected: 'fptiot123',
      page: 'wifi'
    },
    {
      selector: 'body[data-active-tab="specific"] .actions button.apply, .tabs:has(.tab.active[data-t="specific"]) ~ .actions button.apply',
      text: 'Bước 4: chọn Apply để lưu cấu hình',
      position: 'bottom',
      page: 'wifi'
    }
  ]
};

if (idx !== -1) {
  window.DEVICE_AX3000C_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000C_LESSONS.push(lessonObj);
}
