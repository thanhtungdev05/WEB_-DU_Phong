/**
 * devices/be15000/lessons/bai2.js
 * Bài 2 - Cấu hình Wi-Fi MLO (Wi-Fi 7)
 */

window.DEVICE_BE15000_LESSONS = window.DEVICE_BE15000_LESSONS || [];

window.DEVICE_BE15000_LESSONS.push({
  id: 'be15-bai2',
  title: 'Cấu hình wifi',
  subtitle: 'Cấu hình Wi-Fi MLO (Wi-Fi 7)',
  instructions: [
    'Truy cập <b>/sim_be15000</b> và đăng nhập',
    'Chọn menu <b>Local Network > WLAN > MLO</b>',
    '- MLO Enable: <span class="val">On</span>',
    '- MLOBackhaul Enable: <span class="val">On</span>',
    'Bấm <b>Apply</b> để lưu cấu hình',
  ],
  practiceUrl: '/sim_be15000/pages/wlanmlo.html',
  grading: {
    description: 'Kiểm tra trạng thái cấu hình MLO trên BE15000',
    rules: [
      {
        id: 'mlo_enable',
        name: 'MLO Enable',
        selector: '#MLOEnable1',
        expected: true,
        type: 'radio',
        required: true
      },
      {
        id: 'mlo_backhaul',
        name: 'MLOBackhaul Enable',
        selector: '#MESHMLOEnable1',
        expected: true,
        type: 'radio',
        required: true
      }
    ]
  },
  guidePopups: [
    {
      selector: '#wlanConfig:not(.selectClass2Menu)',
      text: 'Chọn WLAN',
      position: 'right'
    },
    {
      selector: '#wlanmlo:not(.AEleMenu3Selected)',
      text: 'Chọn MLO',
      position: 'bottom'
    },
    {
      selector: 'label[for="MLOEnable1"], #MLOEnable1',
      text: 'Bước 1: Bật tính năng MLO (Chọn On)',
      position: 'bottom',
      expected: '1'
    },
    {
      selector: 'label[for="MESHMLOEnable1"], #MESHMLOEnable1',
      text: 'Bước 2: Bật MLO Backhaul (Chọn On)',
      position: 'bottom',
      expected: '1'
    },
    {
      selector: '#Btn_apply',
      text: 'Chọn Apply để lưu cấu hình',
      position: 'top'
    }
  ]
});
