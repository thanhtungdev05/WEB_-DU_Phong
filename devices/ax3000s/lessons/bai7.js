/**
 * devices/ax3000s/lessons/bai7.js
 * Bài 7: Cấu hình Mesh wifi trên AX3000S
 */

window.DEVICE_AX3000S_LESSONS = window.DEVICE_AX3000S_LESSONS || [];

window.DEVICE_AX3000S_LESSONS.push({
  id: 'LAB_AX3000S_07',
  title: 'Bài 7 - Cấu hình Mesh wifi',
  subtitle: 'Thiết lập và quản lý mạng Mesh WiFi',
  instructions: [
    '<b>Yêu cầu:</b>',
    '- Device Role: <span class="val">Controller</span>'
  ],
  practiceUrl: '/sim_ax3000s/app.html#wlanMesh',
  clearFields: [
    'select[name="Frm_DeviceRole"]'
  ],
  grading: {
    description: 'Kiểm tra Mesh WiFi settings trên AX3000S',
    rules: [
      {
        id: 'mesh_role',
        name: 'Mesh Role',
        selector: 'select[name="Frm_DeviceRole"], #Frm_DeviceRole',
        expected: '1',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: []
});
