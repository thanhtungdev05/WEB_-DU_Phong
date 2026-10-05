/**
 * devices/be12000/lessons/bai4.js
 * Bài 4 - Cấu hình DNS trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_04';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình Primary & Secondary DNS trên BE12000',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Primary DNS: <span class="val">210.245.31.220</span>',
    '- Secondary DNS: <span class="val">8.8.8.8</span>'
  ],
  practiceUrl: '/sim_be12000/login',
  onSimLoad: function (simWin) {
    try {
      if (simWin && simWin.top) {
        simWin.top._hasSuccHintStored = false;
        simWin.top._hasClickedSaveInGuide = false;
      }
    } catch (e) { }
  },
  clearFields: [
    '#sub_DNSServer10', '#sub_DNSServer11', '#sub_DNSServer12', '#sub_DNSServer13',
    '#sub_DNSServer20', '#sub_DNSServer21', '#sub_DNSServer22', '#sub_DNSServer23',
    'input[name="sub_DNSServer10"]', 'input[name="sub_DNSServer11"]', 'input[name="sub_DNSServer12"]', 'input[name="sub_DNSServer13"]',
    'input[name="sub_DNSServer20"]', 'input[name="sub_DNSServer21"]', 'input[name="sub_DNSServer22"]', 'input[name="sub_DNSServer23"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình máy chủ Primary DNS & Secondary DNS trên BE12000',
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].querySelector('#sub_DNSServer10') || allDocs[i].querySelector('#Btn_apply_DHCPBasicCfg') || allDocs[i].querySelector('#DHCPBasicCfgBar')) {
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
              name: 'Mở trang cấu hình DHCP Server',
              expected: 'Vào Local Network > LAN > IPv4 > DHCP Server',
              actual: 'Chưa mở mục DHCP Server',
              passed: false,
              message: 'Hãy chọn menu Local Network > LAN > IPv4 và mở mục DHCP Server để cấu hình DNS'
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

      var dns1 = getIP('sub_DNSServer1');
      var dns2 = getIP('sub_DNSServer2');

      var validDns1 = ['210.245.31.220', '210.245.31.221', '8.8.8.8', '1.1.1.1'];
      var validDns2 = ['8.8.8.8', '8.8.4.4', '210.245.31.221', '210.245.31.220', '1.1.1.1'];

      var isSaved = Boolean(
        doc._ftcIsSaved ||
        (doc.location && doc.location.search && doc.location.search.includes('save_success=1')) ||
        (window.top && window.top._hasSuccHintStored) ||
        window._hasSuccHintStored
      );

      var dns1Passed = validDns1.indexOf(dns1) !== -1;
      var dns2Passed = validDns2.indexOf(dns2) !== -1;

      var passedCount = (dns1Passed ? 1 : 0) + (dns2Passed ? 1 : 0);
      var passed = dns1Passed && dns2Passed && isSaved;
      var score = passed ? 100 : (isSaved ? passedCount * 50 : 0);

      var d1Msg = dns1Passed
        ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình DNS')
        : ('Mong muốn: "210.245.31.220" hoặc "8.8.8.8", Thực tế: "' + (dns1 || 'Trống') + '"');
      var d2Msg = dns2Passed
        ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình DNS')
        : ('Mong muốn: "8.8.8.8" hoặc "8.8.4.4", Thực tế: "' + (dns2 || 'Trống') + '"');

      return {
        passed: passed,
        gradable: true,
        score: score,
        passedCount: isSaved ? passedCount : 0,
        totalRules: 2,
        details: [
          {
            id: 'primary_dns',
            name: 'Primary DNS',
            expected: '210.245.31.220 (hoặc 8.8.8.8)',
            actual: (dns1 || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: dns1Passed && isSaved,
            message: d1Msg
          },
          {
            id: 'secondary_dns',
            name: 'Secondary DNS',
            expected: '8.8.8.8 (hoặc 8.8.4.4)',
            actual: (dns2 || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: dns2Passed && isSaved,
            message: d2Msg
          }
        ]
      };
    }
  },
  allowedSelectors: [
    '#sub_DNSServer10', '#sub_DNSServer11', '#sub_DNSServer12', '#sub_DNSServer13',
    '#sub_DNSServer20', '#sub_DNSServer21', '#sub_DNSServer22', '#sub_DNSServer23',
    'input[name^="sub_DNSServer"]',
    '#Btn_apply_DHCPBasicCfg', '#Btn_cancel_DHCPBasicCfg'
  ],
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || []
};

var idx = window.DEVICE_BE12000_LESSONS.findIndex(function (l) { return l.id === lessonId; });
if (idx >= 0) {
  window.DEVICE_BE12000_LESSONS[idx] = lessonData;
} else {
  window.DEVICE_BE12000_LESSONS.push(lessonData);
}
