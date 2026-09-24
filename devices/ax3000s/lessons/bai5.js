/**
 * devices/ax3000s/lessons/bai5.js
 * Bài 5: Cấu hình địa chỉ IP LAN trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

const lessonObj5 = {
  id: 'LAB_AX3000S_05',
  title: 'Cấu hình DHCP',
  subtitle: 'Cấu hình DHCP',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình IPv4 LAN theo các thông số dưới đây:',
    '- IP Address (Gateway): <span class="val">192.168.2.1</span>',
    '- Subnet Mask: <span class="val">255.255.255.0</span>'

  ],
  practiceUrl: '/sim_ax3000s/app.html#lancfgv4',
  clearFields: [],
  grading: {
    description: 'Kiểm tra cấu hình IP LAN và DHCP trên AX3000S',
    rules: [
      {
        id: 'lan_ip',
        name: 'IP Address (Gateway)',
        selector: '#ethIpAddress',
        expected: '192.168.2.1',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_subnet',
        name: 'Subnet Mask',
        selector: '#ethSubnetMask',
        expected: '255.255.255.0',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_dhcp_enable',
        name: 'DHCP Server',
        selector: '#dhcpSrvType2',
        expected: ['1', 'on', 'true', 'ON'],
        type: 'any_of',
        trim: true,
        required: true
      },
      {
        id: 'lan_dhcp_start',
        name: 'Start IP',
        selector: '#dhcpEthStart',
        expected: '192.168.2.2',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_dhcp_end',
        name: 'End IP',
        selector: '#dhcpEthEnd',
        expected: '192.168.2.254',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'lan_dhcp_lease',
        name: 'Lease Time',
        selector: '#dhcpLeasedTime',
        expected: '120',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: []
};

const existingIndex5 = window.DEVICE_AX3000S_LESSONS.findIndex(l => l.id === 'LAB_AX3000S_05');
if (existingIndex5 !== -1) {
  window.DEVICE_AX3000S_LESSONS[existingIndex5] = lessonObj5;
} else {
  window.DEVICE_AX3000S_LESSONS.push(lessonObj5);
}
