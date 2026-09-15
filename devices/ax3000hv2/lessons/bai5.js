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
    'Thực hiện đổi lớp mạng LAN và cấu hình DHCP trên thiết bị theo các thông số:',
    '- IP Address: <span class="val">192.168.100.1</span>',
    '- IP Subnet Mask: <span class="val">255.255.255.0</span>',
    '- DHCP Server: <span class="val">Enable</span>',
    '- Start IP: <span class="val">192.168.100.2</span>',
    '- IP Pool Count: <span class="val">253</span>',
    '- Lease Time: <span class="val">86400</span>'
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=home_lan.asp',
  clearFields: [],
  grading: {
    description: 'Kiểm tra cấu hình đổi IP LAN và DHCP trên AX3000Hv2',
    rules: [
      {
        id: 'dhcp_ip',
        name: 'IP Address',
        selector: 'input[name="uiViewIPAddr"]',
        expected: '192.168.100.1',
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
        expected: '192.168.100.2',
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
      selector: '#MainMenu a:contains("Network"), a[onclick="change_basic(this);"]',
      text: 'Bước 1: Chọn Network',
      position: 'top',
      hideOnPage: 'home_lan.asp'
    },
    {
      selector: 'a[href*="home_lan.asp"], a:contains("LAN")',
      text: 'Bước 2: Chọn LAN',
      position: 'top',
      hideOnPage: 'home_lan.asp'
    },
    {
      selector: 'input[name="uiViewIPAddr" i]',
      page: 'home_lan.asp',
      text: 'Bước 3: Đổi IP Address thành: 192.168.100.1',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="uiViewNetMask" i]',
      page: 'home_lan.asp',
      text: 'Bước 4: Kiểm tra IP Subnet Mask: 255.255.255.0',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="dhcpTypeRadio"][value="1" i]',
      page: 'home_lan.asp',
      text: 'Bước 5: Ở mục DHCP, chọn Enable',
      position: 'top'
    },
    {
      selector: 'input[name="StartIp" i]',
      page: 'home_lan.asp',
      text: 'Bước 6: Đổi Start IP thành: 192.168.100.2',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[value="Save" i], input[name="SaveBtn" i]',
      page: 'home_lan.asp',
      text: 'Bước 7: Chọn Save',
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
