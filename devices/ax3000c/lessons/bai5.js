/**
 * devices/ax3000c/lessons/bai5.js
 * Bài 5: Cấu hình đổi IP LAN và DHCP trên AX3000C
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

var idx = window.DEVICE_AX3000C_LESSONS.findIndex(function (l) { return l.id === 'LAB_AX3000CV2_05'; });
var lessonObj = {
  id: 'LAB_AX3000CV2_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện thay đổi cấu hình địa chỉ IP LAN trên thiết bị theo các thông số được cung cấp dưới đây.',
    '- Router LAN IPv4 Address: <span class="val">192.168.1.1</span>',
    '- Subnet mask: <span class="val">255.255.255.0</span>',
    '- DHCP start address: <span class="val">192.168.1.2</span>',
    '- DHCP end address: <span class="val">192.168.1.249</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/lan',
  grading: {
    description: 'Kiểm tra IP LAN và dải DHCP Pool trên AX3000C',
    rules: [
      {
        id: 'lan_ip',
        name: 'Router LAN IP Address',
        selector: '#lanIp, .card .bd .row:nth-child(1) input, input[value="192.168.1.1"]',
        expected: '192.168.1.1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'subnet_mask',
        name: 'Subnet Mask',
        selector: '.card .bd .row:nth-child(2) input, input[value="255.255.255.0"]',
        expected: '255.255.255.0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_start',
        name: 'DHCP Start Address',
        selector: '#dhcpStart, .card .bd .row:nth-child(3) input, input[value="192.168.1.2"]',
        expected: '192.168.1.2',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dhcp_end',
        name: 'DHCP End Address',
        selector: '#dhcpEnd, .card .bd .row:nth-child(4) input, input[value="192.168.1.249"]',
        expected: '192.168.1.249',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: (window.TOOLTIPS_AX3000C && window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05']) ? window.TOOLTIPS_AX3000C['LAB_AX3000CV2_05'] : [
    {
      selector: 'li.el-submenu:not(.is-opened):contains("Network") .el-submenu__title, .el-submenu__title:contains("Network")',
      text: 'Chọn Network',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:not(.is-opened):contains("LAN") .el-submenu__title, .el-submenu:contains("Network") .el-submenu__title:contains("LAN")',
      text: 'Chọn LAN',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: 'li.el-submenu.is-opened:contains("Network") li.el-submenu:is-opened:contains("LAN") li.el-menu-item:contains("LAN"), .el-menu-item:contains("LAN")',
      text: 'Chọn LAN',
      position: 'right',
      hideOnPage: 'lan'
    },
    {
      selector: '#lanIp, .card .bd .row:nth-child(1) input',
      text: 'Bước 1: đặt IP cho Router ví dụ: 192.168.1.1',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '.card .bd .row:nth-child(2) input',
      text: 'Bước 2: kiểm tra Subnet mask ví dụ: 255.255.255.0',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '#dhcpStart, .card .bd .row:nth-child(3) input',
      text: 'Bước 3: kiểm tra IP bắt đầu tự nhảy thành 192.168.1.2',
      position: 'right',
      page: 'lan'
    },
    {
      selector: '#dhcpEnd, .card .bd .row:nth-child(4) input',
      text: 'Bước 4: kiểm tra IP kết thúc tự nhảy thành 192.168.1.249',
      position: 'right',
      page: 'lan'
    },
    {
      selector: 'button.apply, .actions button.apply, button[onclick*="save"], input[type="submit"]',
      text: 'Bước 5: chọn Apply',
      position: 'bottom',
      page: 'lan'
    }
  ]
};

if (idx !== -1) {
  window.DEVICE_AX3000C_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000C_LESSONS.push(lessonObj);
}
