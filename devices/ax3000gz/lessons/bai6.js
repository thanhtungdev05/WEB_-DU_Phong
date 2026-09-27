/**
 * devices/ax3000gz/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AX3000GZ
 */

window.DEVICE_AX3000GZ_LESSONS = window.DEVICE_AX3000GZ_LESSONS || [];

var idx = window.DEVICE_AX3000GZ_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000GZ_06'; });
var lessonObj = {
  id: 'LAB_AX3000GZ_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Name: <span class="val">FPT Telecom</span>',
    '- Protocol: <span class="val">TCP/UDP</span>',
    '- WAN Host IP Address: <span class="val">0.0.0.0/0</span>',
    '- LAN Host: <span class="val">192.168.1.254</span>',
    '- WAN Port: <span class="val">8080</span>',
    '- LAN Host Port: <span class="val">8080</span>'
  ],
  practiceUrl: '/sim_ax3000gz/cgi-bin/luci/admin/internet/security/forwards',
  clearFields: [
    '[id="modal_field_name"]',
    '[id="modal_field_proto"]',
    '[id="modal_field_src_ip"]',
    '[id="modal_field_dest_ip"]',
    '[id="modal_field_src_dport"]',
    '[id="modal_field_dest_port"]'
  ],
  grading: {
    description: 'Kiểm tra Port Forwarding rules trên AX3000GZ',
    rules: [
      {
        id: 'pf_name',
        name: 'Name',
        selector: '[id="modal_field_name"]',
        expected: 'FPT Telecom',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_enabled',
        name: 'Enable Status',
        selector: '[id="modal_field_enabled"] input[value="1"]',
        expected: '1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_proto',
        name: 'Protocol',
        selector: '[id="modal_field_proto"]',
        expected: 'tcp udp',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_wan_ip',
        name: 'WAN Host IP Address',
        selector: '[id="modal_field_src_ip"]',
        expected: '0.0.0.0/0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_lan_ip',
        name: 'LAN Host',
        selector: '[id="modal_field_dest_ip"]',
        expected: '192.168.1.254',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_wan_port',
        name: 'WAN Port',
        selector: '[id="modal_field_src_dport"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_lan_port',
        name: 'LAN Host Port',
        selector: '[id="modal_field_dest_port"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '#topmenu a[href*="internet"]',
      text: 'Chọn Internet',
      position: 'bottom',
      hideOnPage: 'internet'
    },
    {
      selector: '#sidebarmenu a[href*="/internet/security"]',
      text: 'Chọn Security',
      position: 'right',
      page: 'internet',
      hideOnPage: 'security'
    },
    {
      selector: '.tabs a[href*="forwards"]',
      text: 'Chọn tab Port Forwards',
      position: 'bottom',
      page: 'security',
      hideOnPage: 'forwards'
    },
    {
      selector: '.cbi-button-add',
      text: 'Bấm Add để thêm Port Forwarding',
      position: 'top',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_name"]',
      text: 'Nhập Name: FPT Telecom',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_enabled"] label:nth-child(2)',
      text: 'Chọn Enable: On',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_proto"]',
      text: 'Chọn Protocol: TCP/UDP',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_src_ip"]',
      text: 'Nhập WAN Host IP Address: 0.0.0.0/0',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_dest_ip"]',
      text: 'Nhập LAN Host: 192.168.1.254',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_src_dport"]',
      text: 'Nhập WAN Port: 8080',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '[id="modal_field_dest_port"]',
      text: 'Nhập LAN Host Port: 8080',
      position: 'right',
      page: 'forwards'
    },
    {
      selector: '#modal_overlay .cbi-button-save, .modal .cbi-button-save',
      text: 'Chọn Apply để lưu',
      position: 'bottom',
      page: 'forwards'
    }
  ]
};

if (idx !== -1) {
  window.DEVICE_AX3000GZ_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000GZ_LESSONS.push(lessonObj);
}
