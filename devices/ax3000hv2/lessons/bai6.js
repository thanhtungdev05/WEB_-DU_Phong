/**
 * devices/ax3000hv2/lessons/bai6.js
 * Bài 6: Cấu hình Port Forwarding trên AX3000H v2
 */

window.DEVICE_AX3000HV2_LESSONS = window.DEVICE_AX3000HV2_LESSONS || [];

var lessonObj = {
  id: 'LAB_AX3000HV2_06',
  title: 'Cấu hình Port Forwarding',
  subtitle: 'Cấu hình Port Forwarding',
  instructions: [
    '<b>Yêu cầu:</b>',
    'Thực hiện cấu hình Mở Port trên thiết bị theo các thông số được cung cấp dưới đây:',
    '- Start External Port: <span class="val">8080</span>',
    '- End External Port: <span class="val">8080</span>',
    '- Local IP Address: <span class="val">192.168.1.254</span>',
    '- Start Internal Port: <span class="val">8080</span>',
    '- End Internal Port: <span class="val">8080</span>'
  ],
  practiceUrl: '/sim_ax3000hv2/cgi-bin/index.asp',
  clearFields: [
    'input[name="start_port1"]',
    'input[name="end_port1"]',
    'input[name="Addr1"]',
    'input[name="local_sport"]',
    'input[name="local_eport"]'
  ],
  grading: {
    description: 'Kiểm tra Port Forwarding rules trên AX3000Hv2',
    rules: [
      {
        id: 'pf_start_ext',
        name: 'Start External Port',
        selector: 'input[name="start_port1"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_end_ext',
        name: 'End External Port',
        selector: 'input[name="end_port1"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_ip',
        name: 'Local IP Address',
        selector: 'input[name="Addr1"]',
        expected: '192.168.1.254',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_start_int',
        name: 'Start Internal Port',
        selector: 'input[name="local_sport"]',
        expected: '8080',
        type: 'text_exact',
        trim: true,
        required: true
      },
      {
        id: 'pf_end_int',
        name: 'End Internal Port',
        selector: 'input[name="local_eport"]',
        expected: '8080',
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
        selector: 'a[href*="adv_nat_top.asp"], a:contains("NAT")',
        text: 'Bước 2: Chọn NAT',
        position: 'top'
    },
    {
        selector: 'select[name="NATtyleChange"]',
        text: 'Bước 3: Chọn Virtual Server',
        position: 'right'
    },
    {
        selector: 'input[name="start_port1" i]',
        text: 'Bước 4: Nhập Start External Port: 8080',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="end_port1" i]',
        text: 'Bước 5: Nhập End External Port: 8080',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="Addr1" i]',
        text: 'Bước 6: Nhập Local IP Address: 192.168.1.254',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="local_sport" i]',
        text: 'Bước 7: Nhập Start Internal Port: 8080',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[name="local_eport" i]',
        text: 'Bước 8: Nhập End Internal Port: 8080',
        position: 'right',
        forcePosition: true
    },
    {
        selector: 'input[value="Save" i], input[name="AddBtn" i]',
        text: 'Bước 9: Chọn Save',
        position: 'top'
    }
  ]
};

var idx = window.DEVICE_AX3000HV2_LESSONS.findIndex(function(l) { return l.id === lessonObj.id; });
if (idx !== -1) {
  window.DEVICE_AX3000HV2_LESSONS[idx] = lessonObj;
} else {
  window.DEVICE_AX3000HV2_LESSONS.push(lessonObj);
}
