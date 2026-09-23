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
    description: 'Kiểm tra cấu hình máy chủ IPv4 DNS Server 1 & DNS Server 2 (ghép đủ 4 octet) trên BE12000',
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
            id: 'dns_server_1',
            name: 'IPv4 DNS Server 1 (IP hoàn chỉnh)',
            expected: '210.245.31.220 (hoặc 8.8.8.8)',
            actual: (dns1 || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: dns1Passed && isSaved,
            message: d1Msg
          },
          {
            id: 'dns_server_2',
            name: 'IPv4 DNS Server 2 (IP hoàn chỉnh)',
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
    '#sub_SerIPAddress10', '#sub_SerIPAddress11', '#sub_SerIPAddress12', '#sub_SerIPAddress13',
    '#sub_SerIPAddress20', '#sub_SerIPAddress21', '#sub_SerIPAddress22', '#sub_SerIPAddress23',
    'input[name^="sub_SerIPAddress"]',
    '#Btn_apply_LocalDnsServer', '#Btn_cancel_LocalDnsServer'
  ],
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || []
};

var idx = window.DEVICE_BE12000_LESSONS.findIndex(function (l) { return l.id === lessonId; });
if (idx >= 0) {
  window.DEVICE_BE12000_LESSONS[idx] = lessonData;
} else {
  window.DEVICE_BE12000_LESSONS.push(lessonData);
}
