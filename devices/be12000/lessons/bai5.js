/**
 * devices/be12000/lessons/bai5.js
 * Bài 5 - Cấu hình DHCP trên BE12000
 */

window.DEVICE_BE12000_LESSONS = window.DEVICE_BE12000_LESSONS || [];

var lessonId = 'LAB_BE12000_05';
var lessonData = {
  id: lessonId,
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP Server và dải IP Start/End trên BE12000',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình DHCP Server và dải IP cấp phát tại menu <b>Local Network > LAN > IPv4</b> trong mục <b>DHCP Server</b> theo các thông số sau:',
    '- DHCP Server: <span class="val">On</span>',
    '- LAN IP Address: <span class="val">192.168.1.1</span>',
    '- Subnet Mask: <span class="val">255.255.255.0</span>',
    '- DHCP Start IP Address: <span class="val">192.168.1.2</span>',
    '- DHCP End IP Address: <span class="val">192.168.1.254</span>',
    'Nhấn <b>Apply</b> để lưu cấu hình DHCP.',
    '<br>',
    '<i>Lưu ý: Dải DHCP Start/End phải cùng lớp mạng với LAN IP (192.168.1.0/24) và Start IP < End IP.</i>'
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
    '[id="sub_IPAddr3:DHCPBasicCfg"]',
    '#sub_SubMask3',
    '[id="sub_MinAddress3:DHCPBasicCfg"]',
    '[id="sub_MaxAddress3:DHCPBasicCfg"]',
    'input[name="sub_IPAddr3:DHCPBasicCfg"]',
    'input[name="sub_SubMask3"]',
    'input[name="sub_MinAddress3:DHCPBasicCfg"]',
    'input[name="sub_MaxAddress3:DHCPBasicCfg"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DHCP Server, LAN IP và dải DHCP Start/End trên BE12000',
    rules: [
      {
        id: 'dhcp_server_enable',
        name: 'DHCP Server Enable',
        selector: '#ServerEnable1, input[name="ServerEnable"][value="1"]',
        expected: '1',
        type: 'radio_checked',
        required: true
      },
      {
        id: 'lan_ip_octet3',
        name: 'LAN IP Address - Octet 4',
        selector: '[id="sub_IPAddr3:DHCPBasicCfg"], input[name="sub_IPAddr3:DHCPBasicCfg"]',
        expected: '1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'subnet_mask_octet3',
        name: 'Subnet Mask - Octet 4',
        selector: '#sub_SubMask3, input[name="sub_SubMask3"]',
        expected: '0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_start_octet3',
        name: 'DHCP Start IP Address - Octet 4',
        selector: '[id="sub_MinAddress3:DHCPBasicCfg"], input[name="sub_MinAddress3:DHCPBasicCfg"]',
        expected: ['2', '10', '20', '50', '100'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_end_octet3',
        name: 'DHCP End IP Address - Octet 4',
        selector: '[id="sub_MaxAddress3:DHCPBasicCfg"], input[name="sub_MaxAddress3:DHCPBasicCfg"]',
        expected: ['254', '200', '249', '250'],
        type: 'any_of',
        trim: true,
        required: true
      }
    ],
    customGrading: function (allDocs) {
      var doc = null;
      for (var i = 0; i < allDocs.length; i++) {
        if (allDocs[i].querySelector('#Btn_apply_DHCPBasicCfg') || allDocs[i].querySelector('#DHCPBasicCfgBar') || allDocs[i].querySelector('[id="sub_IPAddr0:DHCPBasicCfg"]')) {
          doc = allDocs[i];
          break;
        }
      }

      if (!doc) {
        return {
          passed: false,
          score: 0,
          passedCount: 0,
          totalRules: 4,
          details: [
            {
              id: 'dhcp_page',
              name: 'Mở trang cấu hình DHCP',
              expected: 'Vào Local Network > LAN > IPv4 > DHCP Server',
              actual: 'Chưa mở mục DHCP Server',
              passed: false,
              message: 'Hãy chọn menu Local Network > LAN > IPv4 và mở mục DHCP Server để cấu hình'
            }
          ]
        };
      }

      var getIP = function (prefix, suffix) {
        var parts = [];
        for (var j = 0; j < 4; j++) {
          var id = prefix + j + (suffix || '');
          var el = doc.getElementById(id) || doc.querySelector('[id="' + id + '"]') || doc.querySelector('input[name="' + id + '"]');
          parts.push(el ? el.value.trim() : '');
        }
        return parts.join('.');
      };

      // 1. DHCP Server Enable (On)
      var serverEnableEl = doc.querySelector('#ServerEnable1');
      var serverEnablePassed = serverEnableEl ? serverEnableEl.checked : false;

      // 2. LAN IP Address & Subnet Mask
      var lanIP = getIP('sub_IPAddr', ':DHCPBasicCfg');
      var subnetMask = getIP('sub_SubMask', '');
      var lanPassed = (lanIP === '192.168.1.1') && (subnetMask === '255.255.255.0');

      // 3. DHCP Start IP Address
      var dhcpStart = getIP('sub_MinAddress', ':DHCPBasicCfg');
      var startParts = dhcpStart.split('.');
      var startOctet3 = parseInt(startParts[3], 10);
      var dhcpStartPassed = (dhcpStart === '192.168.1.2') || (startParts.length === 4 && startParts[0] === '192' && startParts[1] === '168' && startParts[2] === '1' && !isNaN(startOctet3) && startOctet3 >= 2 && startOctet3 <= 253);

      // 4. DHCP End IP Address
      var dhcpEnd = getIP('sub_MaxAddress', ':DHCPBasicCfg');
      var endParts = dhcpEnd.split('.');
      var endOctet3 = parseInt(endParts[3], 10);
      var dhcpEndPassed = (dhcpEnd === '192.168.1.254' || dhcpEnd === '192.168.1.249' || dhcpEnd === '192.168.1.250') || (endParts.length === 4 && endParts[0] === '192' && endParts[1] === '168' && endParts[2] === '1' && !isNaN(endOctet3) && endOctet3 > startOctet3 && endOctet3 <= 254);

      var passedCount = (serverEnablePassed ? 1 : 0) + (lanPassed ? 1 : 0) + (dhcpStartPassed ? 1 : 0) + (dhcpEndPassed ? 1 : 0);
      var passed = serverEnablePassed && lanPassed && dhcpStartPassed && dhcpEndPassed;
      var score = passedCount * 25;

      return {
        passed: passed,
        score: score,
        passedCount: passedCount,
        totalRules: 4,
        details: [
          {
            id: 'dhcp_server_enable',
            name: 'DHCP Server Enable',
            expected: 'On',
            actual: serverEnablePassed ? 'On' : 'Off',
            passed: serverEnablePassed,
            message: serverEnablePassed ? 'Chính xác' : 'Cần chọn "On" tại mục DHCP Server'
          },
          {
            id: 'lan_ip_subnet',
            name: 'LAN IP Address & Subnet Mask',
            expected: '192.168.1.1 / 255.255.255.0',
            actual: (lanIP || 'Trống') + ' / ' + (subnetMask || 'Trống'),
            passed: lanPassed,
            message: lanPassed ? 'Chính xác' : 'Mong muốn: IP 192.168.1.1, Subnet Mask 255.255.255.0'
          },
          {
            id: 'dhcp_start_ip',
            name: 'DHCP Start IP Address',
            expected: '192.168.1.2',
            actual: dhcpStart || 'Trống',
            passed: dhcpStartPassed,
            message: dhcpStartPassed ? 'Chính xác' : 'Mong muốn: "192.168.1.2", Thực tế: "' + (dhcpStart || 'Trống') + '"'
          },
          {
            id: 'dhcp_end_ip',
            name: 'DHCP End IP Address',
            expected: '192.168.1.254',
            actual: dhcpEnd || 'Trống',
            passed: dhcpEndPassed,
            message: dhcpEndPassed ? 'Chính xác' : 'Mong muốn: "192.168.1.254", Thực tế: "' + (dhcpEnd || 'Trống') + '"'
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
      selector: '#lanConfig:not(.selectClass2Menu)',
      text: 'Chọn LAN',
      position: 'bottom'
    },
    {
      selector: '#lanMgrIpv4:not(.selectClass3Menu)',
      text: 'Chọn IPv4',
      position: 'bottom'
    },
    {
      selector: '#DHCPBasicCfgBar[aria-expanded="false"], #DHCPBasicCfg:not(:has(#DHCPBasicCfg_container:visible)) #DHCPBasicCfgBar',
      text: 'Mở mục DHCP Server',
      position: 'top',
      offsetX: 120
    },
    {
      selector: 'label[for="ServerEnable1"], #ServerEnable1',
      text: 'Bước 1: Chọn On để bật DHCP Server',
      position: 'top'
    },
    {
      selector: '[id="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled), input[name="sub_IPAddr3:DHCPBasicCfg"]:not(:disabled)',
      text: 'Bước 2: LAN IP Address: 192.168.1.1',
      position: 'right',
      expected: '1'
    },
    {
      selector: '#sub_SubMask3:not(:disabled), input[name="sub_SubMask3"]:not(:disabled)',
      text: 'Bước 3: Nhập Subnet Mask: 255.255.255.0',
      position: 'right',
      expected: '0'
    },
    {
      selector: '[id="sub_MinAddress3:DHCPBasicCfg"]:not(:disabled), input[name="sub_MinAddress3:DHCPBasicCfg"]:not(:disabled)',
      text: 'Bước 4: DHCP Start IP Address: 192.168.1.2',
      position: 'right',
      expected: '2'
    },
    {
      selector: '[id="sub_MaxAddress3:DHCPBasicCfg"]:not(:disabled), input[name="sub_MaxAddress3:DHCPBasicCfg"]:not(:disabled)',
      text: 'Bước 5: DHCP End IP Address: 192.168.1.254',
      position: 'right',
      expected: '254'
    },
    {
      selector: '#Btn_apply_DHCPBasicCfg:not(.disableBtn), [id="Btn_apply_DHCPBasicCfg"]:not(.disableBtn)',
      text: 'Bước 6: Nhấn Apply để lưu cấu hình DHCP',
      position: 'top'
    }
  ]
};

window.DEVICE_BE12000_LESSONS.push(lessonData);
