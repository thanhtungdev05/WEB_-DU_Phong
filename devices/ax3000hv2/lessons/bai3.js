/**
 * devices/ax3000hv2/lessons/bai3.js
 * Bài 3: Cấu hình Wi-Fi IoT trên AX3000H v2
 */

window.DEVICE_AX3000HV2_LESSONS = window.DEVICE_AX3000HV2_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000HV2_03',
  title: 'Cấu hình wifi IoT',
  subtitle: 'Cấu hình wifi IoT',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình mạng Wi-Fi IoT trên băng tần 2.4GHz theo các thông số dưới đây:',
    '- SSID Name: <span class="val">FPT IoT</span>',
    '- WPA Key: <span class="val">fptiot123</span>',
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=wifi5.asp',
  clearFields: [
    'input[name="wifi5SSid_2G"]',
    'input[name="wifi5Pwd_2G"]'
  ],
  grading: {
    description: 'Kiểm tra SSID IoT và WPA Key trên AX3000Hv2 (băng tần 2.4GHz)',
    rules: [
      {
        id: 'iot_ssid_2g',
        name: 'Tên Wi-Fi IoT 2.4G (SSID)',
        selector: 'input[name="wifi5SSid_2G"]',
        expected: 'FPT IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_key_2g',
        name: 'Mật khẩu Wi-Fi IoT 2.4G',
        selector: 'input[name="wifi5Pwd_2G"]',
        expected: 'fptiot123',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ],
    allowedSelectors: [
      'input[name="Enable_Wifi5_2G"]',
      'input[name="Enable_Wifi5_5G"]',
      'input[name="ESSID_HIDE_Selection_2G"]',
      'input[name="ESSID_HIDE_Selection_5G"]'
    ]
  },
  allowedSelectors: [
    'input[name="Enable_Wifi5_2G"]',
    'input[name="Enable_Wifi5_5G"]',
    'input[name="ESSID_HIDE_Selection_2G"]',
    'input[name="ESSID_HIDE_Selection_5G"]'
  ],
  guidePopups: [
    {
      selector: 'a[onclick="change_basic(this);"], #MainMenu a:contains("Network")',
      text: 'Bước 1: Chọn Network',
      hideOnPage: 'wifi5.asp',
      position: 'top'
    },
    {
      selector: 'a[href*="wifi5.asp"], a:contains("IOT SSID")',
      text: 'Bước 2: Chọn IOT SSID',
      hideOnPage: 'wifi5.asp',
      position: 'top'
    },
    {
      selector: 'input[name="Enable_Wifi5_2G"][value="1" i]',
      page: 'wifi5.asp',
      text: 'Bước 3: Ở mục 2.4G WiFi5, chọn Enable',
      position: 'top'
    },
    {
      selector: 'input[name="wifi5SSid_2G" i], #wifi5SSid_2G',
      page: 'wifi5.asp',
      text: 'Bước 4: Nhập tên Wifi: FPT IoT',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="wifi5Pwd_2G" i], #wifi5Pwd_2G',
      page: 'wifi5.asp',
      text: 'Bước 5: Nhập mật khẩu Wifi: fptiot123',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[value="Save" i], input[name="SaveBtn" i]',
      page: 'wifi5.asp',
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
