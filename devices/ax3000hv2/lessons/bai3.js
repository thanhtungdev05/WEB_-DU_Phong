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
    'Thực hiện cấu hình mạng Wi-Fi IoT theo các thông số dưới đây:',
    '- SSID Name: <span class="val">FPT IoT</span>',
    '- WPA Key: <span class="val">fptiot123</span>',
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp?page=wifi5.asp',
  clearFields: [
    'input[name="wifi5SSid_2G"]',
    'input[name="wifi5Pwd_2G"]',
    'input[name="wifi5SSid_5G"]',
    'input[name="wifi5Pwd_5G"]'
  ],
  grading: {
    description: 'Kiểm tra SSID IoT và WPA Key trên AX3000Hv2',
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
      },
      {
        id: 'iot_ssid_5g',
        name: 'Tên Wi-Fi IoT 5G (SSID)',
        selector: 'input[name="wifi5SSid_5G"]',
        expected: 'FPT IoT',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'iot_key_5g',
        name: 'Mật khẩu Wi-Fi IoT 5G',
        selector: 'input[name="wifi5Pwd_5G"]',
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
      selector: 'a[onclick="change_basic(this);"]',
      text: 'Bước 1: Chọn Network',
      position: 'top'
    },
    {
      selector: 'a[href*="wifi5.asp"]',
      text: 'Bước 2: Chọn IOT SSID',
      position: 'top'
    },
    {
      selector: 'input[name="Enable_Wifi5_2G"][value="1" i]',
      text: 'Bước 3: Chọn Enable',
      position: 'top'
    },
    {
      selector: 'input[name="wifi5SSid_2G" i]',
      text: 'Bước 4: Nhập tên Wifi: FPT IoT',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="wifi5Pwd_2G" i]',
      text: 'Bước 5: Nhập mật khẩu Wifi: fptiot123',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="Enable_Wifi5_5G"][value="1" i]',
      text: 'Bước 6: Chọn Enable 5G',
      position: 'top'
    },
    {
      selector: 'input[name="wifi5SSid_5G" i]',
      text: 'Bước 7: Nhập tên Wifi 5G: FPT IoT',
      position: 'right',
      forcePosition: true
    },
    {
      selector: 'input[name="wifi5Pwd_5G" i]',
      text: 'Bước 8: Nhập mật khẩu Wifi 5G: fptiot123',
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
