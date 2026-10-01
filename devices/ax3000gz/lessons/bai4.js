/**
 * devices/ax3000gz/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên AX3000GZ
 */

window.DEVICE_AX3000GZ_LESSONS = window.DEVICE_AX3000GZ_LESSONS || [];

window.DEVICE_AX3000GZ_LESSONS.push({
  id: 'LAB_AX3000GZ_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">8.8.8.8</span>',
    '- Secondary DNS: <span class="val">8.8.4.4</span>'
  ],
  practiceUrl: '/sim_ax3000gz/cgi-bin/luci/admin/localnetwork/lan',
  clearFields: [
    '[id="widget.cbid.network.lan.Primary_DNS"]',
    '[id="widget.cbid.network.lan.Secondary_DNS"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DNS trên AX3000GZ',
    rules: [
      {
        id: 'dns_primary',
        name: 'Primary DNS',
        selector: '[id="widget.cbid.network.lan.Primary_DNS"]',
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_secondary',
        name: 'Secondary DNS',
        selector: '[id="widget.cbid.network.lan.Secondary_DNS"]',
        expected: '8.8.4.4',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '#topmenu a[href*="localnetwork"]',
      text: 'Bước 1: Chọn Local Network',
      position: 'bottom',
      hideOnPage: 'localnetwork'
    },
    {
      selector: '#sidebarmenu a[href*="/localnetwork/lan"]',
      text: 'Bước 2: Chọn LAN',
      position: 'right',
      page: 'localnetwork',
      hideOnPage: 'lan'
    },
    {
      selector: '#cbi-network h3',
      text: 'Bước 3: Chọn DHCP Server',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '[id="widget.cbid.network.lan.Primary_DNS"]',
      text: 'Bước 4: Nhập Primary DNS: 8.8.8.8',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '[id="widget.cbid.network.lan.Secondary_DNS"]',
      text: 'Bước 5: Nhập Secondary DNS: 8.8.4.4',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '.cbi-page-actions .cbi-button-save',
      text: 'Bước 6: Chọn Apply để lưu cấu hình',
      position: 'top',
      page: 'lan'
    }
  ]
});
