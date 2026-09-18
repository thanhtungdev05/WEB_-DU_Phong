/**
 * devices/be12000/lessons/bai6.js
 * Bài 6 - Cấu hình Port Forwarding trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_06';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình mở cổng (NAT / Port Forwarding) trên BE12000',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mở cổng dịch vụ tại menu <b>Internet > Security > Port Forwarding</b> bằng cách nhấn <b>Create New Item</b> và nhập đầy đủ 5 tiêu chí sau:',
    '- 1. Name: <span class="val">NAT FPT</span> (hoặc Camera, Web Server)',
    '- 2. Protocol: <span class="val">TCP</span> (hoặc UDP, TCP And UDP)',
    '- 3. LAN Host: <span class="val">192.168.1.100</span>',
    '- 4. WAN Port: <span class="val">8080</span>',
    '- 5. LAN Host Port: <span class="val">8080</span>',
    'Nhấn <b>Apply</b> để lưu cấu hình rule.',
    '<br>',
    '<i>Gợi ý: Nếu cấu hình mở 1 port đơn, nhập 8080 vào ô WAN Port và LAN Host Port.</i>'
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
    '[id^="Alias"]:not(#Alias)',
    '[id^="InternalClient"]:not(#InternalClient)',
    '[id^="ExternalPort"]:not(#ExternalPort)',
    '[id^="ExternalPortEndRange"]:not(#ExternalPortEndRange)',
    '[id^="InternalPort"]:not(#InternalPort)',
    '[id^="InternalPortEndRange"]:not(#InternalPortEndRange)',
    'input[name="Alias"]',
    'input[name="InternalClient"]',
    'input[name="ExternalPort"]',
    'input[name="ExternalPortEndRange"]',
    'input[name="InternalPort"]',
    'input[name="InternalPortEndRange"]'
  ],
  grading: {
    description: 'Kiểm tra 5 tiêu chí mở cổng Port Forwarding trên BE12000',
    rules: [
      {
        id: 'rule_name',
        name: '1. Rule Name',
        selector: 'div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Alias"], [id="Alias:0"]',
        expected: ['NAT FPT', 'Camera', 'Web', 'NAT', 'Web Server'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'protocol',
        name: '2. Protocol',
        selector: 'div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Protocol"], [id="Protocol:0"]',
        expected: ['TCP', 'UDP', 'BOTH', 'TCP&UDP', 'TCP+UDP'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'lan_host',
        name: '3. LAN Host IP',
        selector: 'div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalClient"], [id="InternalClient:0"]',
        expected: '192.168.1.100',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'wan_port',
        name: '4. WAN Port',
        selector: 'div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="ExternalPort"], [id="ExternalPort:0"], [id="ExternalPortEndRange:0"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_port',
        name: '5. LAN Host Port',
        selector: 'div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalPort"], [id="InternalPort:0"], [id="InternalPortEndRange:0"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].querySelector('#PortForwardingBar') || allDocs[i].querySelector('#addInstBar_PortForwarding') || allDocs[i].querySelector('[id^="Btn_apply_PortForwarding"]')) {
          doc = allDocs[i];
          break;
        }
      }

      if (!doc) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 5,
          details: [
            {
              id: 'portforwarding_page',
              name: 'Mở trang cấu hình Port Forwarding',
              expected: 'Vào Internet > Security > Port Forwarding',
              actual: 'Chưa mở trang Port Forwarding',
              passed: false,
              message: 'Hãy chọn menu Internet > Security > Port Forwarding để cấu hình'
            }
          ]
        };
      }

      // Tìm container item đã tạo (không phải template ẩn)
      var itemContainer = doc.querySelector("div[id^='template_PortForwarding']:not(#template_PortForwarding)") || doc.querySelector("#template_PortForwarding_0");

      if (!itemContainer) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 5,
          details: [
            {
              id: 'create_item',
              name: 'Tạo rule mới',
              expected: 'Nhấn Create New Item để tạo rule',
              actual: 'Chưa tạo rule nào',
              passed: false,
              message: 'Hãy nhấn vào "Create New Item" để bắt đầu thêm cấu hình mở port'
            }
          ]
        };
      }

      var getVal = function (idName) {
        var el = itemContainer.querySelector("[id^='" + idName + "']") || itemContainer.querySelector("[name='" + idName + "']");
        return el ? el.value.trim() : '';
      };

      var name = getVal('Alias');
      var protocol = getVal('Protocol');
      var lanHost = getVal('InternalClient');
      var wanPort = getVal('ExternalPort') || getVal('ExternalPortEndRange');
      var lanPort = getVal('InternalPort') || getVal('InternalPortEndRange');

      var isSaved = Boolean(
        doc._ftcIsSaved ||
        (doc.location && doc.location.search && doc.location.search.includes('save_success=1')) ||
        (window.top && window.top._hasSuccHintStored) ||
        window._hasSuccHintStored
      );

      // 1. Name
      var namePassed = name.length > 0 && (name === 'NAT FPT' || name.toLowerCase().indexOf('nat') !== -1 || name.toLowerCase().indexOf('camera') !== -1 || name.toLowerCase().indexOf('web') !== -1);

      // 2. Protocol
      var validProtocols = ['TCP', 'UDP', 'BOTH', 'TCP&UDP', 'TCP+UDP', 'TCP AND UDP'];
      var protocolPassed = validProtocols.indexOf(protocol.toUpperCase()) !== -1;

      // 3. LAN Host: siết chặt chỉ chấp nhận đúng IP máy chủ LAN 192.168.1.100 (không cho phép nhập bừa hoặc trùng IP router 192.168.1.1)
      var lanHostPassed = (lanHost === '192.168.1.100');

      // 4. WAN Port: siết chặt chỉ chấp nhận đúng cổng 8080 theo yêu cầu bài thực hành
      var wanPortPassed = (wanPort === '8080');

      // 5. LAN Host Port: siết chặt chỉ chấp nhận đúng cổng 8080 theo yêu cầu bài thực hành
      var lanPortPassed = (lanPort === '8080');

      var passedCount = (namePassed ? 1 : 0) + (protocolPassed ? 1 : 0) + (lanHostPassed ? 1 : 0) + (wanPortPassed ? 1 : 0) + (lanPortPassed ? 1 : 0);
      var passed = (passedCount === 5) && isSaved;
      var score = passed ? 100 : (isSaved ? passedCount * 20 : 0);

      return {
        passed: passed,
        score: score,
        passedCount: isSaved ? passedCount : 0,
        totalRules: 5,
        details: [
          {
            id: 'rule_name',
            name: '1. Name (Tên rule)',
            expected: 'NAT FPT (hoặc Camera, Web Server)',
            actual: (name || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: namePassed && isSaved,
            message: namePassed ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình Port Forwarding') : 'Cần nhập tên rule (ví dụ: NAT FPT)'
          },
          {
            id: 'protocol',
            name: '2. Protocol (Giao thức)',
            expected: 'TCP (hoặc UDP, TCP And UDP)',
            actual: (protocol || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: protocolPassed && isSaved,
            message: protocolPassed ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình Port Forwarding') : 'Cần chọn giao thức TCP, UDP hoặc TCP And UDP'
          },
          {
            id: 'lan_host',
            name: '3. LAN Host (Địa chỉ IP máy trong)',
            expected: '192.168.1.100',
            actual: (lanHost || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: lanHostPassed && isSaved,
            message: lanHostPassed ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình Port Forwarding') : ('Mong muốn: "192.168.1.100", Thực tế: "' + (lanHost || 'Trống') + '"')
          },
          {
            id: 'wan_port',
            name: '4. WAN Port (Cổng ngoài)',
            expected: '8080',
            actual: (wanPort || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: wanPortPassed && isSaved,
            message: wanPortPassed ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình Port Forwarding') : ('Mong muốn: "8080", Thực tế: "' + (wanPort || 'Trống') + '"')
          },
          {
            id: 'lan_port',
            name: '5. LAN Host Port (Cổng trong)',
            expected: '8080',
            actual: (lanPort || '(Trống)') + (!isSaved ? ' (Chưa lưu)' : ''),
            passed: lanPortPassed && isSaved,
            message: lanPortPassed ? (isSaved ? 'Chính xác' : 'Chưa bấm Apply trên trang thiết bị để lưu cấu hình Port Forwarding') : ('Mong muốn: "8080", Thực tế: "' + (lanPort || 'Trống') + '"')
          }
        ]
      };
    }
  },
  guidePopups: (window.TOOLTIPS_BE12000 && window.TOOLTIPS_BE12000[lessonId]) || [
    {
      selector: '#internet:not(.SelectMenuItem)',
      text: 'Truy cập: Internet',
      position: 'bottom'
    },
    {
      selector: '#security:not(.selectClass2Menu)',
      text: 'Chọn Security',
      position: 'bottom'
    },
    {
      selector: '#portForwarding:not(.selectClass3Menu)',
      text: 'Chọn Port Forwarding',
      position: 'bottom'
    },
    {
      selector: '[id="Alias:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Alias"]:not(:disabled)',
      text: 'Bước 1: Nhập Name: NAT FPT',
      position: 'right',
      expected: 'NAT FPT'
    },
    {
      selector: '[id="Protocol:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Protocol"]:not(:disabled)',
      text: 'Bước 2: Chọn Protocol: TCP, UDP hoặc TCP/UDP',
      position: 'right',
      expected: ['TCP', 'UDP', 'BOTH', 'TCP&UDP', 'TCP+UDP']
    },
    {
      selector: '[id="InternalClient:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalClient"]:not(:disabled)',
      text: 'Bước 3: Nhập LAN Host: 192.168.1.100',
      position: 'right',
      expected: '192.168.1.100'
    },
    {
      selector: '[id="ExternalPortEndRange:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="ExternalPortEndRange"]:not(:disabled)',
      text: 'Bước 4: Nhập WAN Port: 8080 (chỉ vào ô cuối cùng)',
      position: 'right',
      expected: '8080'
    },
    {
      selector: '[id="InternalPortEndRange:0"]:not(:disabled), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="InternalPortEndRange"]:not(:disabled)',
      text: 'Bước 5: Nhập LAN Host Port: 8080 (chỉ vào ô cuối cùng)',
      position: 'right',
      expected: '8080'
    },
    {
      selector: '[id="Btn_apply_PortForwarding:0"]:not(.disableBtn), div[id^="template_PortForwarding"]:not(#template_PortForwarding) [id^="Btn_apply_PortForwarding"]:not(.disableBtn)',
      text: 'Bước 6: Nhấn Apply để lưu cấu hình',
      position: 'top'
    }
  ]
};

window.DEVICE_BE12000_LESSONS.push(lessonData);
