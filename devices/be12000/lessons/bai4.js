/**
 * devices/be12000/lessons/bai4.js
 * Bài 4 - Cấu hình DNS trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_04';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS Server trên BE12000',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình máy chủ DNS tại menu <b>Local Network > DNS</b> trong mục <b>DNS</b> theo các thông số sau:',
    '- IPv4 DNS Server 1: <span class="val">210.245.31.220</span> (hoặc 8.8.8.8)',
    '- IPv4 DNS Server 2: <span class="val">8.8.8.8</span> (hoặc 8.8.4.4)',
    'Nhấn <b>Apply</b> để lưu cấu hình DNS',
    '<br>',
    '<i>Gợi ý DNS FPT: 210.245.31.220, 210.245.31.221</i>',
    '<i>Gợi ý DNS Google: 8.8.8.8, 8.8.4.4</i>',
    '<i>Gợi ý DNS Cloudflare: 1.1.1.1</i>'
  ],
  practiceUrl: '/sim_be12000/login',
  onSimLoad: function (simWin) {
    try {
      fetch('/sim_be12000/api/reset').catch(function () { });
      if (simWin && simWin.top) {
        simWin.top._hasSuccHintStored = false;
        simWin.top._hasClickedSaveInGuide = false;
      }
    } catch (e) { }
  },
  clearFields: [
    '#sub_SerIPAddress10', '#sub_SerIPAddress11', '#sub_SerIPAddress12', '#sub_SerIPAddress13',
    '#sub_SerIPAddress20', '#sub_SerIPAddress21', '#sub_SerIPAddress22', '#sub_SerIPAddress23',
    'input[name="sub_SerIPAddress10"]', 'input[name="sub_SerIPAddress11"]', 'input[name="sub_SerIPAddress12"]', 'input[name="sub_SerIPAddress13"]',
    'input[name="sub_SerIPAddress20"]', 'input[name="sub_SerIPAddress21"]', 'input[name="sub_SerIPAddress22"]', 'input[name="sub_SerIPAddress23"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình 4 octet của IPv4 DNS Server 1 & DNS Server 2 trên BE12000',
    rules: [
      {
        id: 'dns1_octet0',
        name: 'DNS 1 - Octet 1',
        selector: '#sub_SerIPAddress10, input[name="sub_SerIPAddress10"]',
        expected: ['210', '8', '1'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns1_octet1',
        name: 'DNS 1 - Octet 2',
        selector: '#sub_SerIPAddress11, input[name="sub_SerIPAddress11"]',
        expected: ['245', '8', '1'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns1_octet2',
        name: 'DNS 1 - Octet 3',
        selector: '#sub_SerIPAddress12, input[name="sub_SerIPAddress12"]',
        expected: ['31', '8', '1'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns1_octet3',
        name: 'DNS 1 - Octet 4',
        selector: '#sub_SerIPAddress13, input[name="sub_SerIPAddress13"]',
        expected: ['220', '221', '8', '1'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns2_octet0',
        name: 'DNS 2 - Octet 1',
        selector: '#sub_SerIPAddress20, input[name="sub_SerIPAddress20"]',
        expected: ['8', '1', '210'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns2_octet1',
        name: 'DNS 2 - Octet 2',
        selector: '#sub_SerIPAddress21, input[name="sub_SerIPAddress21"]',
        expected: ['8', '1', '245'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns2_octet2',
        name: 'DNS 2 - Octet 3',
        selector: '#sub_SerIPAddress22, input[name="sub_SerIPAddress22"]',
        expected: ['8', '4', '1', '31'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dns2_octet3',
        name: 'DNS 2 - Octet 4',
        selector: '#sub_SerIPAddress23, input[name="sub_SerIPAddress23"]',
        expected: ['8', '4', '1', '221', '220'],
        type: 'any_of',
        trim: true,
        required: true
      }
    ],
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].querySelector('#sub_SerIPAddress10') || allDocs[i].querySelector('#Btn_apply_LocalDnsServer')) {
          doc = allDocs[i];
          break;
        }
      }

      if (!doc) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 2,
          details: [
            {
              id: 'dns_page',
              name: 'Mở trang cấu hình DNS',
              expected: 'Vào Local Network > DNS > DNS',
              actual: 'Chưa mở trang DNS',
              passed: false,
              message: 'Hãy chọn menu Local Network > DNS và mở mục DNS để cấu hình'
            }
          ]
        };
      }

      var getIP = function (prefix) {
        var parts = [];
        for (var j = 0; j < 4; j++) {
          var el = doc.querySelector('#' + prefix + j) || doc.querySelector('input[name="' + prefix + j + '"]');
          parts.push(el ? el.value.trim() : '');
        }
        return parts.join('.');
      };

      var dns1 = getIP('sub_SerIPAddress1');
      var dns2 = getIP('sub_SerIPAddress2');

      var validDns1 = ['210.245.31.220', '210.245.31.221', '8.8.8.8', '1.1.1.1'];
      var validDns2 = ['8.8.8.8', '8.8.4.4', '210.245.31.221', '210.245.31.220', '1.1.1.1'];

      var dns1Passed = validDns1.indexOf(dns1) !== -1;
      var dns2Passed = validDns2.indexOf(dns2) !== -1;

      var passedCount = (dns1Passed ? 1 : 0) + (dns2Passed ? 1 : 0);
      var passed = dns1Passed && dns2Passed;
      var score = passedCount * 50;

      return {
        passed: passed,
        score: score,
        passedCount: passedCount,
        totalRules: 2,
        details: [
          {
            id: 'dns_server_1',
            name: 'IPv4 DNS Server 1 (4 octet)',
            expected: '210.245.31.220 (hoặc 8.8.8.8)',
            actual: dns1 || '(Trống)',
            passed: dns1Passed,
            message: dns1Passed ? 'Chính xác' : ('Mong muốn: "210.245.31.220", Thực tế: "' + (dns1 || 'Trống') + '"')
          },
          {
            id: 'dns_server_2',
            name: 'IPv4 DNS Server 2 (4 octet)',
            expected: '8.8.8.8 (hoặc 8.8.4.4)',
            actual: dns2 || '(Trống)',
            passed: dns2Passed,
            message: dns2Passed ? 'Chính xác' : ('Mong muốn: "8.8.8.8", Thực tế: "' + (dns2 || 'Trống') + '"')
          }
        ]
      };
    }
  },
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || [
    {
      selector: '#localnet:not(.SelectMenuItem)',
      text: 'Chọn Local Network',
      position: 'bottom'
    },
    {
      selector: '#dns:not(.selectClass2Menu)',
      text: 'Chọn DNS',
      position: 'right'
    },
    {
      selector: '#LocalDnsServerBar[aria-expanded="false"], #LocalDnsServer:not(:has(#LocalDnsServer_container:visible)) #LocalDnsServerBar',
      text: 'Mở mục DNS',
      position: 'top'
    },
    {
      selector: '#sub_SerIPAddress13:not(:disabled), input[id="sub_SerIPAddress13"]:not(:disabled)',
      text: 'Bước 1: Nhập IPv4 DNS Server 1: 210.245.31.220',
      position: 'right',
      expected: '220'
    },
    {
      selector: '#sub_SerIPAddress23:not(:disabled), input[id="sub_SerIPAddress23"]:not(:disabled)',
      text: 'Bước 2: Nhập IPv4 DNS Server 2: 8.8.8.8',
      position: 'right',
      expected: '8'
    },
    {
      selector: '#Btn_apply_LocalDnsServer:not(.disableBtn), [id="Btn_apply_LocalDnsServer"]:not(.disableBtn)',
      text: 'Bước 3: Nhấn Apply để lưu cấu hình DNS',
      position: 'top'
    }
  ]
};

window.DEVICE_BE12000_LESSONS.push(lessonData);
