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
  displayTitle: 'Bài 7 - Cấu hình Mesh AX3000CV2 với AX3000CV2',
  shortTitle: 'Cấu hình Mesh AX3000CV2 với AX3000CV2',
  subtitle: 'Cấu hình Mesh AX3000CV2 với AX3000CV2',
  isMeshTopologyLab: true,
  meshLabScenario: 'p3_mesh_ax3000cv2',
  meshRequiredDevices: ['ax3000c', 'ax3000c'],
  meshPairLabel: 'AX3000CV2 (Controller) với AX3000CV2 (Agent)',
  meshPracticeUrl: '/mesh-lab.html?embed=1&lab=LAB_AX3000CV2_07&device=ax3000c&scenario=p3_mesh_ax3000cv2',
  instructions: [
    '<b>Yêu cầu bài thực hành Cấu hình Mesh AX3000CV2 với AX3000CV2 (4 Bước):</b>',
    '- <b>Thiết bị bắt buộc:</b> Kéo thả đúng <b>2 thiết bị AX3000CV2</b> từ kệ thiết bị bên dưới lên Canvas (chọn thiết bị khác sẽ báo lỗi sai thiết bị).',
    '- <b>Bước 1 (Chọn Mode Mesh):</b> Vào giao diện Web GUI của thiết bị AX3000CV2 chính (<code>Network &gt;&gt; Wi-Fi &gt;&gt; Easymesh</code>): Bật <b>Enabled</b> = <span class="val">Bật</span>, chọn <b>MeshRole</b> = <span class="val">Controller</span>. Thiết bị AX3000CV2 phụ thứ 2 giữ nguyên <b>Enabled</b> = <span class="val">Bật</span>, <b>MeshRole</b> = <span class="val">Agent</span>.',
    '- <b>Bước 2 (Cấu hình trên thiết bị chính):</b> Chỉ cấu hình đúng 2 phần trên thiết bị AX3000CV2 chính (<i>tuyệt đối không sửa LAN/DHCP/DNS hay các mục khác</i>):',
    '  + <b>PPPoE (WAN):</b> Username <span class="val">sgfdl-123456-789</span> / Password <span class="val">d123456</span>',
    '  + <b>Wi-Fi:</b> Tắt <i>Use separate SSID</i>, SSID <span class="val">FPT Telecom</span> / Password <span class="val">fpt12345</span>',
    '- <b>Bước 3 (Kiểm tra Đấu Nối Dây):</b> Dùng công cụ nối cáp nối cổng <span class="val">LAN ➔ LAN</span> giữa 2 thiết bị AX3000CV2.',
    '- <b>Bước 4 (Kiểm tra Sơ đồ Topology Mesh):</b> Vào <code>Status &gt;&gt; Easymesh Topo</code> xác nhận thiết bị Agent đã kết nối vào sơ đồ Topology Mesh và đồng bộ Wi-Fi.',
  ],
  practiceUrl: '/sim_ax3000c/#/network/easymesh',
  onSimLoad: function (simWin) {
    if (simWin && typeof simWin.evaluatePortalMeshLessonSync === 'function') return;
    FTC_AX3000C.datTrangThaiBai(simWin, 7);
  },
  grading: {
    description: 'Kiểm tra 4 bước cấu hình Mesh AX3000CV2 với AX3000CV2 (Đạt / Chưa đạt)',
    customGrading: function (iframeWin) {
      if (iframeWin && typeof iframeWin.evaluatePortalMeshLessonSync === 'function') {
        return iframeWin.evaluatePortalMeshLessonSync('LAB_AX3000CV2_07');
      }
      return null;
    },
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
