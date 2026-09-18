/**
 * devices/vigor2927/tooltips/bai2.js — Tooltip Hướng dẫn cho Bài 2: Cấu hình giới hạn băng thông
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

function isVigor2927Bai2LimitDone(doc) {
  if (!doc) return false;
  var tx = doc.querySelector('input[name="sIpBandwDefTx"]');
  var rx = doc.querySelector('input[name="sIpBandwDefRx"]');
  var txUnit = doc.querySelector('select[name="iDefTx"]');
  var rxUnit = doc.querySelector('select[name="iDefRx"]');
  if (!tx || !rx) return false;
  var txVal = (tx.value || '').trim();
  var rxVal = (rx.value || '').trim();
  var txU = txUnit ? txUnit.value : '1';
  var rxU = rxUnit ? rxUnit.value : '1';
  return (txVal === '20' && rxVal === '25' && (txU === '1' || txU === 'Mbps') && (rxU === '1' || rxU === 'Mbps'));
}

window.TOOLTIPS_VIGOR2927['vg2927-bai2'] = [
  {
    selector: '#menu-bandwidth:not(.open) .menu-text, #menu-bandwidth:not(.open)',
    text: 'Bước 1: chọn Bandwidth Management',
    position: 'bottom'
  },
  {
    selector: '#sub-bandwidth:not(.hidden) #menu-bandwidth-limit .menu-text, #sub-bandwidth:not(.hidden) #menu-bandwidth-limit',
    text: 'Bước 2: chọn Bandwidth Limit',
    position: 'bottom'
  },
  {
    selector: '#lbl-bandwidth-disable, b:contains("Disable")',
    text: 'Bước 3: chọn Enable',
    position: 'right',
    offsetX: 8,
    condition: function(doc) { return !isVigor2927Bai2LimitDone(doc); }
  },
  {
    selector: '#opt-bandwidth-tx-limit, input[name="sIpBandwDefTx"]',
    text: 'Bước 4: nhập giới hạn tốc độ truyền cho tất cả thiết bị, ví dụ 20 Mbps',
    position: 'bottom',
    condition: function(doc) { return !isVigor2927Bai2LimitDone(doc); }
  },
  {
    selector: '#opt-bandwidth-rx-limit, input[name="sIpBandwDefRx"]',
    text: 'Bước 5: nhập giới hạn tốc độ nhận cho tất cả thiết bị, ví dụ 25 Mbps',
    position: 'top',
    condition: function(doc) { return !isVigor2927Bai2LimitDone(doc); }
  },
  {
    selector: 'text:End IP',
    text: 'Bước 6: thay đổi băng thông cho một dãy hay một IP cụ thể (cao hơn hoặc thấp hơn)<br>ví dụ: điền vào Start IP: 192.168.1.10 và End IP: 192.168.1.20, đồng thời gán tốc độ TX,<br>ví dụ: 20 Mbps và RX, ví dụ: 25 Mbps cho thiết bị (hoặc dãy thiết bị) đó.<br>- Trong đó, “Each” là mỗi IP trong dãy đều được sử dụng tối đa băng thông quy định;<br>“Share” là tất cả IP trong dãy sử dụng tổng băng thông quy định. Ở đây chọn "Each"<br>==> Sau đó chọn Add để lưu',
    position: 'top',
    condition: function(doc) { return isVigor2927Bai2LimitDone(doc); }
  },
  {
    selector: 'select[name="nSch1"]',
    text: 'Bước 7: Bạn có thể quy định thời gian để chức năng Bandwidth Limit<br>có hiệu lực bằng cách chỉnh Time Schedule. Ở đây chọn None.',
    position: 'bottom',
    condition: function(doc) { return isVigor2927Bai2LimitDone(doc); }
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 8: chọn OK',
    position: 'top',
    condition: function(doc) { return isVigor2927Bai2LimitDone(doc); }
  }
];
