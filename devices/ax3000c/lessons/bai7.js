/**
 * devices/ax3000c/lessons/bai7.js
 * Bài 7: Cấu hình Mesh wifi trên AX3000CV2 (firmware 0.5.3 — bài mới, bản cũ không có)
 * Anh Huynn chốt 2026-09-26: bắt đầu ở MeshRole = Agent (Enabled bật), đáp án Enabled bật +
 * MeshRole = Controller. Lúc Agent thì trang Wi-Fi / Wi-Fi Advanced bị khoá như máy thật.
 * Chỉ thêm vào portal — chưa có trong danh mục bài của backend (migration 030) nên dashboard
 * chưa hiển thị bài này (anh Huynn chọn).
 */

window.DEVICE_AX3000C_LESSONS = window.DEVICE_AX3000C_LESSONS || [];

window.DEVICE_AX3000C_LESSONS.push({
  id: 'LAB_AX3000CV2_07',
  title: 'Cấu hình Mesh wifi',
  subtitle: 'Cấu hình Mesh wifi',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thiết bị đang hoạt động ở vai trò Agent trong hệ thống Mesh nên không cấu hình được Wi-Fi. Thực hiện cấu hình Easymesh để thiết bị làm Controller theo các thông số dưới đây:',
    '- Enabled: <span class="val">Bật</span>',
    '- MeshRole: <span class="val">Controller</span>',
  ],
  practiceUrl: '/sim_ax3000c/#/network/easymesh',
  onSimLoad: function (simWin) { FTC_AX3000C.datTrangThaiBai(simWin, 7); },
  grading: {
    description: 'Kiểm tra cấu hình Easymesh trên AX3000CV2',
    rules: [
      {
        id: 'mesh_enabled',
        name: 'Enabled',
        selector: FTC_AX3000C.o('Enabled'),
        expected: 'on',
        valueLabels: { 'on': 'Bật', 'false': 'Tắt' },
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'mesh_role',
        name: 'MeshRole',
        selector: FTC_AX3000C.o('MeshRole'),
        expected: 'Controller',
        type: 'text_exact',
        trim: true,
        required: true
      }
    ]
  },
  guidePopups: window.TOOLTIPS_AX3000C['LAB_AX3000CV2_07']
});
