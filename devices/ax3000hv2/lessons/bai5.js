/**
 * devices/ax3000hv2/lessons/bai5.js
 * Bài 5: Cấu hình DHCP trên AX3000H v2
 */

window.DEVICE_AX3000HV2_LESSONS = window.DEVICE_AX3000HV2_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000HV2_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện thay đổi cấu hình DHCP trên thiết bị theo các thông số:',
    '- IP Address: <span class="val">192.168.1.1</span>',
    '- IP Subnet Mask: <span class="val">255.255.255.0</span>',
    '- DHCP Server: <span class="val">Enable</span>',
    '- Start IP: <span class="val">192.168.1.2</span>',
    '- IP Pool Count: <span class="val">253</span>',
    '- Lease Time: <span class="val">86400</span>'
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=home_lan.asp',
  clearFields: [
    'input[name="uiViewIPAddr"]',
    'input[name="uiViewNetMask"]',
    'input[name="PoolSize"]',
    'input[name="dhcp_LeaseTime"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DHCP trên AX3000Hv2',
    rules: [
      {
        id: 'dhcp_ip',
        name: 'IP Address',
        selector: 'input[name="uiViewIPAddr"]',
        expected: '192.168.1.1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_mask',
        name: 'IP Subnet Mask',
        selector: 'input[name="uiViewNetMask"]',
        expected: '255.255.255.0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_enable',
        name: 'DHCP Server Enable',
        selector: 'input[name="dhcpTypeRadio"][value="1" i]:checked',
        expected: 'Enable',
        type: 'element_exists',
        required: true
      },
      {
        id: 'dhcp_start',
        name: 'Start IP',
        selector: 'input[name="StartIp"]',
        expected: '192.168.1.2',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_pool',
        name: 'IP Pool Count',
        selector: 'input[name="PoolSize"]',
        expected: '253',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_lease',
        name: 'Lease Time',
        selector: 'input[name="dhcp_LeaseTime"]',
        expected: '86400',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: 'a[onclick="change_basic(this);"]',
      text: 'Bước 1: Chọn Network',
      position: 'top'
    },
    {
      selector: 'a[href*="home_lan.asp"]',
      text: 'Bước 2: Chọn LAN',
      position: 'top'
    },
    {
      selector: 'input[name="uiViewIPAddr" i]',
      text: 'Bước 3: Nhập IP Address: 192.168.1.1',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="uiViewNetMask" i]',
      text: 'Bước 4: Nhập IP Subnet Mask: 255.255.255.0',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="dhcpTypeRadio"][value="1" i]',
      text: 'Bước 5: Ở mục DHCP, chọn Enable',
      position: 'top'
    },
    {
      selector: 'input[name="StartIp" i]',
      text: 'Bước 6: Nhập Start IP: 192.168.1.2',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="PoolSize" i]',
      text: 'Bước 7: Nhập IP Pool Count: 253',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="dhcp_LeaseTime" i]',
      text: 'Bước 8: Nhập Lease Time: 86400',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[value="Save" i], input[name="SaveBtn" i]',
      text: 'Bước 9: Chọn Save',
      position: 'top'
    }
  ]
};

var idx = window.DEVICE_AX3000HV2_LESSONS.findIndex(function (l) { return l.id === lessonObj.id; });
if (idx !== -1) {
  window.DEVICE_AX3000HV2_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000HV2_LESSONS.push(lessonObj);
}
