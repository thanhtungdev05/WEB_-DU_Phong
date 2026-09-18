/**
 * devices/ax3000gz/lessons/bai5.js
 * Bài 5: Cấu hình DHCP trên AX3000GZ
 */

window.DEVICE_AX3000GZ_LESSONS = window.DEVICE_AX3000GZ_LESSONS || [];

var idx = window.DEVICE_AX3000GZ_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000GZ_05'; });
var lessonObj = {
  id: 'LAB_AX3000GZ_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b> Thực hiện đổi lớp mạng LAN trên thiết bị theo thông số sau:',
    '- LAN IP Address: <span class="val">192.168.10.1</span>',
    '- DHCP Server: <span class="val">On</span>'
  ],
  practiceUrl: '/sim_ax3000gz/cgi-bin/luci/admin/localnetwork/lan',
  clearFields: [],
  grading: {
    description: 'Kiểm tra cấu hình đổi IP LAN và DHCP trên AX3000GZ',
    rules: [
      {
        id: 'dhcp_enable',
        name: 'DHCP Server Enable',
        selector: '[id="widget.cbid.network.lan.ignore.0"]',
        expected: ['0', 'true', 'On', 'on'],
        type: 'any_of',
        required: true
      },
      {
        id: 'dhcp_ip',
        name: 'LAN IP Address',
        selector: '[id="widget.cbid.network.lan.ipaddr"]',
        expected: '192.168.10.1',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '#topmenu a[href*="localnetwork"]',
      text: 'Chọn Local Network',
      position: 'bottom',
      hideOnPage: 'localnetwork'
    },
    {
      selector: '#sidebarmenu a[href*="/localnetwork/lan"]',
      text: 'Chọn LAN',
      position: 'right',
      page: 'localnetwork',
      hideOnPage: 'lan'
    },
    {
      selector: '#cbi-network h3',
      text: 'Chọn DHCP Server',
      position: 'right',
      page: 'lan'
    },
    {
      selector: 'label[for="widget.cbid.network.lan.ignore.0"] + span, [id="widget.cbid.network.lan.ignore.0"]',
      text: 'Bước 1: Chọn Enable: On',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '[id="widget.cbid.network.lan.ipaddr"]',
      text: 'Bước 2: Nhập LAN IP Address: 192.168.10.1',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '.cbi-page-actions .cbi-button-save',
      text: 'Bước 3: Chọn Apply để lưu cấu hình',
      position: 'top',
      page: 'lan'
    }
  ]
};

if (idx !== -1) {
  window.DEVICE_AX3000GZ_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000GZ_LESSONS.push(lessonObj);
}

window.TOOLTIPS_AX3000GZ = window.TOOLTIPS_AX3000GZ || {};
window.TOOLTIPS_AX3000GZ['LAB_AX3000GZ_05'] = lessonObj.guidePopups;
