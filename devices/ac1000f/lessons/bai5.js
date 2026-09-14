/**
 * devices/ac1000f/lessons/bai5.js
 * Bài 5: Cấu hình DHCP
 */

window.DEVICE_AC1000F_LESSONS = window.DEVICE_AC1000F_LESSONS || [];

var idx = window.DEVICE_AC1000F_LESSONS.findIndex(function(l) { return l.id === 'LAB_AC1000F_05'; });
var lesson = {
  id: 'LAB_AC1000F_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b> Thực hiện thay đổi cấu hình DHCP trên thiết bị theo các thông số:',
    '- IP Address: <span class="val">192.168.1.1</span>',
    '- IP Subnet Mask: <span class="val">255.255.255.0</span>',
    '- DHCP Server: <span class="val">Enable</span>',
    '- Start IP: <span class="val">192.168.1.2</span>',
    '- End IP: <span class="val">192.168.1.254</span>',
    '- Lease Time: <span class="val">86400</span>'
  ],
  practiceUrl: '/sim_ac1000f/cgi-bin/index.asp?page=home_lan.asp',

  // Xóa trắng ô Lease Time để người dùng tự nhập dữ liệu
  clearFields: [
    'input[name="dhcp_LeaseTime"]'
  ],

  grading: {
    description: 'Kiểm tra cấu hình IP LAN và DHCP',
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].URL.toLowerCase().indexOf('home_lan.asp') !== -1) {
          doc = allDocs[i];
          break;
        }
      }

      function getVal(selector) {
        if (!doc) return '';
        try {
          var el = doc.querySelector(selector);
          if (el) return el.value.trim();
        } catch (e) { }
        return '';
      }

      function getRadio(name) {
        if (!doc) return '';
        try {
          var el = doc.querySelector('input[name="' + name + '"]:checked');
          if (el) return el.value;
        } catch (e) { }
        return '';
      }

      var rules = [
        { id: '1', name: 'IP Address', expected: '192.168.1.1', actual: getVal('input[name="uiViewIPAddr"]') },
        { id: '2', name: 'IP Subnet Mask', expected: '255.255.255.0', actual: getVal('input[name="uiViewNetMask"]') },
        { id: '3', name: 'DHCP', expected: 'Enable', actual: getRadio('dhcpTypeRadio') === '1' ? 'Enable' : 'Disable' },
        { id: '4', name: 'Start IP', expected: '192.168.1.2', actual: getVal('input[name="StartIp"]') },
        { id: '5', name: 'End IP', expected: '192.168.1.254', actual: getVal('input[name="EndIp"]') },
        { id: '6', name: 'Lease Time', expected: '86400', actual: getVal('input[name="dhcp_LeaseTime"]') }
      ];

      var passedCount = 0;
      var details = [];
      rules.forEach(function (r) {
        var isMatch = (r.actual === r.expected);
        if (isMatch) passedCount++;
        details.push({
          id: r.id,
          name: r.name,
          expected: r.expected,
          actual: r.actual || '(Chưa nhập)',
          passed: isMatch,
          message: isMatch ? 'Chính xác' : ('Mong muốn: "' + r.expected + '", Thực tế: "' + (r.actual || 'Trống') + '"')
        });
      });

      return {
        passed: passedCount === rules.length,
        score: Math.round((passedCount / rules.length) * 100),
        passedCount: passedCount,
        totalRules: rules.length,
        details: details
      };
    }
  }
};

if (idx !== -1) {
    window.DEVICE_AC1000F_LESSONS[idx] = lesson;
} else {
    window.DEVICE_AC1000F_LESSONS.push(lesson);
}
