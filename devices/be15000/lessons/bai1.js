/**
 * devices/be15000/lessons/bai1.js
 * Bài 1 - Xem thiết bị ONT BE15000
 */

window.DEVICE_BE15000_LESSONS = [
  {
    id: 'be15-bai1',
    title: 'Xem thiết bị ONT BE15000',
    subtitle: 'Khảo sát và xem thông tin thiết bị ONT BE15000',
    noConfig: true,
    instructions: [
      'Truy cập <b>/sim_be15000</b> và đăng nhập vào thiết bị ONT BE15000.',
      'Khảo sát giao diện quản trị, xem thông tin hệ thống, trạng thái mạng và các tính năng.',
      'Bài học này chỉ dùng để xem giao diện thiết bị và <b>không yêu cầu cấu hình</b>.',
      'Bấm <b>Nộp bài</b> để hoàn tất bài khảo sát thiết bị.'
    ],
    practiceUrl: '/sim_be15000/login',
    clearFields: [],
    grading: {
      description: 'Xem thiết bị ONT BE15000 (không yêu cầu cấu hình)',
      customGrading: function () {
        return {
          passed: true,
          score: 100,
          passedCount: 1,
          totalRules: 1,
          details: [
            {
              id: 'view_be15000',
              name: 'Xem thiết bị ONT BE15000',
              expected: 'Xem giao diện thiết bị (không cần cấu hình)',
              actual: 'Đã hoàn thành xem thiết bị',
              passed: true,
              message: 'Đã hoàn thành xem thiết bị ONT BE15000'
            }
          ]
        };
      },
      rules: []
    },
    guidePopups: []
  }
];
