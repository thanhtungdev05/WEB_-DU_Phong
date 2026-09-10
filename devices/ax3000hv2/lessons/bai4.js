/**
 * devices/ax3000hv2/lessons/bai4.js
 * Bài 4: Cấu hình DNS trên AX3000H v2
 */

window.DEVICE_AX3000HV2_LESSONS = window.DEVICE_AX3000HV2_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000HV2_04',
  title: 'Cấu hình DNS',
  subtitle: 'Cấu hình DNS',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện thiết lập thông số DNS thủ công (Manually) trên cổng LAN:',
    '- Primary DNS: <span class="val">8.8.8.8</span>',
    '- Secondary DNS: <span class="val">8.8.4.4</span>',
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=home_lan.asp',
  clearFields: [
    'input[name="PrimaryDns"]',
    'input[name="SecondDns"]'
  ],
  grading: {
    description: 'Kiểm tra cấu hình DNS trên AX3000Hv2',
    rules: [
      {
        id: 'dns_primary',
        name: 'Primary DNS',
        selector: 'input[name="PrimaryDns"]',
        expected: '8.8.8.8',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'dns_secondary',
        name: 'Secondary DNS',
        selector: 'input[name="SecondDns"]',
        expected: '8.8.4.4',
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
      selector: 'input[name="dnsTypeRadio"][value="1" i]',
      text: 'Bước 3: Ở mục DNS Relay, chọn Manually',
      position: 'right'
    },
    {
      selector: 'input[name="PrimaryDns" i]',
      text: 'Bước 4: Nhập Primary DNS: 8.8.8.8',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="SecondDns" i]',
      text: 'Bước 5: Nhập Secondary DNS: 8.8.4.4',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[value="Save" i], input[name="SaveBtn" i]',
      text: 'Bước 6: Chọn Save',
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
