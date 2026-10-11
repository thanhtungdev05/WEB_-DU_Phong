/**
 * devices/be6500c/lessons/bai1.js
 */
window.DEVICE_BE6500C_LESSONS = window.DEVICE_BE6500C_LESSONS || [];

var bai1 = {
  id: 'be6500c-bai1',
  title: 'Cấu hình PPPoE',
  subtitle: 'Cấu hình PPPoE',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Cấu hình kết nối mạng PPPoE cho thiết bị:',
    '- Username: <span class="val">hnfdl-123456-789</span>',
    '- Password: <span class="val">d123456</span>',
  ],
  practiceUrl: '/sim_be6500c/advanced__wan.html',
  clearFields: ['input[name="ipv4Settings.pppoe.username"]', 'input[name="ipv4Settings.pppoe.password"]'],
  customClear: function () {
    try {
      var iframe = document.getElementById('device-iframe') || document.getElementById('deviceIframe');
      var doc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
      if (doc) {
        var u = doc.querySelector('input[name="ipv4Settings.pppoe.username"]');
        var p = doc.querySelector('input[name="ipv4Settings.pppoe.password"]');
        if (u && !u._ftcUserModified && u.value === 'fpt') {
          u.value = '';
          delete u.dataset.ftcCleared;
        }
        if (p && !p._ftcUserModified && p.value === 'fpt') {
          p.value = '';
          delete p.dataset.ftcCleared;
        }
      }
    } catch (e) { }
  },
  grading: {
    description: 'Kiểm tra cấu hình PPPoE',
    allowedSelectors: [
      'input[name="ipv4Settings.protocol"]',
      'div[id*="ipv4Settings.protocol"]',
      'input[name="ipv6Settings.protocol"]',
      'div[id*="ipv6Settings.protocol"]',
      'input[name="radio"]',
      '.MuiRadio-root',
      '.PrivateSwitchBase-input',
      '.MuiFormControlLabel-root'
    ],
    rules: [
      {
        "id": "ip_version_mode",
        "name": "Basics IP Mode",
        "selector": "input[name=\"radio\"][value=\"10\"]:checked, input[name=\"radio\"][value=\"4\"]:checked, input[name=\"radio\"][value=\"6\"]:checked, input[name*=\"radio\"][value=\"10\"]:checked, input[name*=\"radio\"][value=\"4\"]:checked, input[name*=\"radio\"][value=\"6\"]:checked, input[name=\"radio-ipver\"][value=\"10\"]:checked, input[name=\"radio-ipver\"][value=\"4\"]:checked, input[name=\"radio-ipver\"][value=\"6\"]:checked, input[value=\"10\"]:checked, input[value=\"4\"]:checked, input[value=\"6\"]:checked",
        "expected": "10",
        "displayExpected": "IPv4 & IPv6",
        "valueLabels": {
          "10": "IPv4 & IPv6",
          "4": "IPv4",
          "6": "IPv6"
        },
        "type": "text_exact",
        "required": true
      },
      {
        "id": "wan_protocol",
        "name": "Connection Type",
        "selector": "input[name=\"ipv4Settings.protocol\"]",
        "expected": "pppoe",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "pppoe_user",
        "name": "Username",
        "selector": "input[name=\"ipv4Settings.pppoe.username\"]",
        "expected": "hnfdl-123456-789",
        "type": "text_exact",
        "trim": true,
        "required": true
      },
      {
        "id": "pppoe_pass",
        "name": "Password",
        "selector": "input[name=\"ipv4Settings.pppoe.password\"]",
        "expected": "d123456",
        "type": "text_exact",
        "trim": true,
        "required": true
      }
    ]
  },
  allowedSelectors: [
    'div[id*="ipv4Settings.protocol"]',
    'input[name="ipv4Settings.protocol"]',
    'div[id*="ipv6Settings.protocol"]',
    'input[name="ipv6Settings.protocol"]',
    'input[name="radio"]',
    '.MuiRadio-root',
    '.PrivateSwitchBase-input',
    '.MuiFormControlLabel-root'
  ],
  guidePopups: [
    {
      "selector": ".MuiTypography-subtitle2:contains(\"Advanced\"), svg[data-testid=\"TuneTwoToneIcon\"], svg[data-testid=\"TuneOutlinedIcon\"]",
      "text": "Bước 1: Chọn Advanced",
      "position": "right"
    },
    {
      "selector": "li.MuiMenuItem-root:contains(\"WAN\"), .MuiTypography-root:contains(\"WAN\"), p:contains(\"WAN\"), span:contains(\"WAN\")",
      "text": "Bước 2: Chọn WAN",
      "position": "right"
    },
    {
      "selector": ".MuiFormControlLabel-root:has(input[value=\"10\"]), span:contains(\"IPv4 & IPv6\"), input[name=\"radio\"][value=\"10\"]",
      "text": "Bước 3: Kiểm tra/chọn mục Basics là IPv4 & IPv6",
      "position": "bottom"
    },
    {
      "selector": ".MuiTypography-subtitle1:contains(\"IPv4 Connection Type\")",
      "text": "Bước 4: Chọn IPv4 Connection Type",
      "position": "top"
    },
    {
      "selector": "div[id*=\"ipv4Settings.protocol\"]",
      "text": "Bước 5: Chọn PPPoE của phần Connection Type",
      "position": "right"
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.username\"]",
      "text": "Bước 6: Nhập Username: hnfdl-123456-789",
      "position": "right",
      "condition": function (doc) {
        var protoInp = doc.querySelector('input[name="ipv4Settings.protocol"]');
        var protoVal = ((protoInp && protoInp.value) || '').toLowerCase();
        if (protoVal !== 'pppoe') return false;
        var el = doc.querySelector('input[name="ipv4Settings.pppoe.username"]');
        if (!el) return false;
        var fc = el.closest('.MuiFormControl-root');
        return !fc || (fc.style.display !== 'none' && fc.offsetWidth > 0);
      }
    },
    {
      "selector": "input[name=\"ipv4Settings.pppoe.password\"]",
      "text": "Bước 7: Nhập Password: d123456",
      "position": "right",
      "condition": function (doc) {
        var protoInp = doc.querySelector('input[name="ipv4Settings.protocol"]');
        var protoVal = ((protoInp && protoInp.value) || '').toLowerCase();
        if (protoVal !== 'pppoe') return false;
        var el = doc.querySelector('input[name="ipv4Settings.pppoe.password"]');
        if (!el) return false;
        var fc = el.closest('.MuiFormControl-root');
        return !fc || (fc.style.display !== 'none' && fc.offsetWidth > 0);
      }
    },
    {
      "selector": "button.alternative-layout--submit, .formActionButton.submit, body:has(input[name=\"ipv4Settings.pppoe.username\"]) button.alternative-layout--submit",
      "text": "Bước 8: Chọn Save để lưu cấu hình",
      "position": "bottom"
    }
  ]
};

var existingIndex = window.DEVICE_BE6500C_LESSONS.findIndex(function (l) { return l.id === 'be6500c-bai1'; });
if (existingIndex >= 0) {
  window.DEVICE_BE6500C_LESSONS[existingIndex] = bai1;
} else {
  window.DEVICE_BE6500C_LESSONS.push(bai1);
}
