/**
 * devices/ax3000s/tooltips/bai3.js — Tooltip Hướng dẫn cho Bài 3: Cấu hình WIFI IOT
 */

if (!window.TOOLTIPS_AX3000S) window.TOOLTIPS_AX3000S = {};

window.TOOLTIPS_AX3000S['LAB_AX3000S_03'] = [
  // Chọn WLAN
  {
    selector: "a[href*='/wlan'], #Sky_WLAN span, #Sky_WLAN",
    text: 'Bước 1: Chọn WLAN',
    position: 'bottom',
    hideOnPage: 'wlan'
  },
  // Chọn Advance
  {
    selector: "#layer2-leaf-advance .dt, #layer2-leaf-advance",
    text: 'Bước 2: Chọn Advance',
    position: 'right',
    page: 'wlan',
    hideOnPage: 'wlanMapSettingAll'
  },
  // Chọn Multiple SSID (ID generated from title "Multiple SSID" -> "Sky_Multiple_SSID")
  {
    selector: '#layer2-leaf-advance #Sky_Multiple_SSID, #Sky_Multiple_SSID',
    text: 'Bước 3: Chọn Multiple SSID',
    position: 'right',
    page: 'wlan',
    hideOnPage: 'wlanMapSettingAll'
  },
  // Bước 4: Wi-Fi Network_3 (IOT WiFi)
  {
    selector: 'div.collapsible:nth-of-type(2) .collapsible-header:not(.active)',
    text: 'Bước 4: Chọn Wi-Fi Network_3 (IOT WiFi)',
    position: 'top',
    page: 'wlanMapSettingAll'
  },
  // Tắt Band Steering nếu lỡ bị bật (chỉ hiện khi Band Steering đang checked)
  {
    selector: 'div.collapsible:nth-of-type(2) .active + .collapsible-content label[for="Chk_BandSteeringEnable_3"]',
    text: 'Bước phụ: Tắt Band Steering (để tách riêng 2.4GHz)',
    position: 'right',
    page: 'wlanMapSettingAll',
    condition: function(doc) {
      const chk = doc.querySelector('#Chk_BandSteeringEnable_3');
      return chk && chk.checked;
    }
  },
  // Bước 5: Tick chọn Enable (Bật 2.4GHz)
  {
    selector: 'div.collapsible:nth-of-type(2) .active + .collapsible-content label[for="Chk_SsidEnable_2G_3"]',
    text: 'Bước 5: Tick chọn Enable (Bật 2.4GHz)',
    position: 'right',
    page: 'wlanMapSettingAll',
    expected: 'on'
  },
  // Bước 6: Đặt tên Wi-Fi IOT (2.4G) FPT Telecom-IoT
  {
    selector: 'div.collapsible:nth-of-type(2) .active + .collapsible-content #Txt_SSID_2G_3',
    text: 'Bước 6: Đặt tên Wi-Fi IOT (2.4G) FPT Telecom-IoT',
    position: 'right',
    page: 'wlanMapSettingAll',
    expected: 'FPT Telecom-IoT'
  },
  // Bước 7: Đặt mật khẩu IOT (2.4G) 19006600
  {
    selector: 'div.collapsible:nth-of-type(2) .active + .collapsible-content #Pwd_WpaPsk_2G_3',
    text: 'Bước 7: Đặt mật khẩu IOT (2.4G) 19006600',
    position: 'right',
    page: 'wlanMapSettingAll',
    expected: '19006600'
  },
  // Bước 8: Lưu cấu hình IOT
  {
    selector: 'div.collapsible:nth-of-type(2) .active + .collapsible-content button[onclick="BntClick_Apply(2)"]',
    text: 'Bước 8: Lưu cấu hình IOT',
    position: 'top',
    page: 'wlanMapSettingAll'
  }
];
