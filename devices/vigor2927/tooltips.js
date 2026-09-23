/**
 * devices/vigor2927/tooltips.js — Danh sách Tooltip & Target Hướng dẫn cho Vigor2927
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

window.TOOLTIPS_VIGOR2927._common_login = [
  {
    selector: 'input.userpwd:not([type="password"])',
    text: 'Nhập admin',
    position: 'right'
  },
  {
    selector: 'input.userpwd[type="password"]',
    text: 'Nhập admin',
    position: 'right'
  },
  {
    selector: 'input.login',
    text: 'Bấm Đăng Nhập',
    position: 'bottom'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai1'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-internet .menu-text, #sub-wan:not(.hidden) #menu-wan-internet',
    text: 'Bước 2: chọn Internet Access',
    position: 'bottom'
  },
  {
    selector: 'input[name="btnDtPage0"], input[value="Details Page"]',
    text: 'Bước 3: Chọn Details Page',
    position: 'top'
  },
  {
    selector: '#tab1.offtab, #tab1:not(.ontab)',
    text: 'Bước 4: chọn PPPoE',
    position: 'bottom'
  },
  {
    selector: '#lbl-pppoe-disable, input[name="PPPoE"][value="0"]',
    text: 'Bước 5: chọn Enable',
    position: 'right',
    expected: '1'
  },
  {
    selector: '#opt-pppoe-username, input[name="sDOutUser1"]',
    text: 'Bước 6: nhập sgfdl-211208-218',
    position: 'right',
    expected: 'sgfdl-211208-218'
  },
  {
    selector: '#opt-pppoe-password, input[name="sDOutPass1"]',
    text: 'Bước 7: nhập 12345678',
    position: 'right',
    expected: '12345678'
  },
  {
    selector: '#btn-pppoe-ok, input[name="submit"][value="OK"], input[type="submit"][value="OK"]',
    text: 'Bước 8: nhấn OK',
    position: 'top'
  }
];

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

function isVigor2927Bai3Added(doc) {
  if (!doc) return false;
  try {
    var win = doc.defaultView || doc.parentWindow;
    if (win && Array.isArray(win.aryIpBindMac) && win.aryIpBindMac.length > 0) {
      for (var i = 0; i < win.aryIpBindMac.length; i++) {
        var item = win.aryIpBindMac[i];
        if (item && item[0] === '192.168.1.100') return true;
      }
    }
    var slt = doc.querySelector('select[name="sltIpMac"]');
    if (slt && slt.options) {
      for (var j = 0; j < slt.options.length; j++) {
        var txt = slt.options[j].text || slt.options[j].innerText || '';
        if (txt.includes('192.168.1.100')) return true;
      }
    }
    if (doc._ftcLastAddIp === '192.168.1.100' || (window._ftcLastAddIp === '192.168.1.100' && (doc._ftcHasClickedAdd || window._ftcHasClickedAdd))) {
      return true;
    }
  } catch(e) {}
  return false;
}

window.TOOLTIPS_VIGOR2927['vg2927-bai3'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-ipbmac .menu-text, #sub-lan:not(.hidden) #menu-lan-ipbmac',
    text: 'Bước 2: chọn Blind IP to MAC',
    position: 'bottom',
    hideOnPage: 'ipbmac'
  },
  {
    selector: '#lbl-ipbmac-disable, b:contains("Disable")',
    text: 'Bước 3: chọn Enable',
    position: 'right',
    offsetX: 8,
    condition: function(doc) { return !isVigor2927Bai3Added(doc); }
  },
  {
    selector: '#txt-ipbmac-ip, input[name="sIpAddress"]',
    text: 'Bước 4: nhập địa chỉ IP và MAC muốn cố định<br>ví dụ IP Address 192.168.1.100<br>MAC Address AA-BB-CC-DD-EE-FF<br>==>chọn Add để lưu',
    position: 'top',
    condition: function(doc) { return !isVigor2927Bai3Added(doc); }
  },
  {
    selector: '#btn-ipbmac-ok, input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    condition: function(doc) { return isVigor2927Bai3Added(doc); }
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai4'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'select[name="sLanMask"]',
    text: 'Bước 4: điền IP Address 192.168.100.1<br>chọn Subnet Mask 255.255.255.0',
    position: 'bottom',
    page: 'sht'
  },
  {
    selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
    text: 'Bước 5: chọn Enable Server<br>- Start IP Address: 192.168.100.10<br>- IP Pool Counts: 200<br>- Gateway IP Address: 192.168.100.1<br>- Lease Time: 86400',
    position: 'top',
    minTop: -4,
    offsetY: 3,
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai5'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: Chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'b:contains("DNS Server IP Address"), text:DNS Server IP Address',
    text: 'Bước 4: nhập DNS của công ty và google, ví dụ:<br>- Primary IP Address: 210.245.31.220<br>- Secondary IP Address: 8.8.8.8',
    position: 'top',
    page: 'sht'
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 5: chọn OK',
    position: 'top',
    page: 'sht'
  }
];

window.TOOLTIPS_VIGOR2927['vg2927-bai6'] = [
  {
    selector: '#menu-wan:not(.open) .menu-text, #menu-wan:not(.open)',
    text: 'Bước 1: chọn WAN',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen'
  },
  {
    selector: '#sub-wan:not(.hidden) #menu-wan-general .menu-text, #sub-wan:not(.hidden) #menu-wan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'mwangen1|mwangen'
  },
  {
    selector: '.ldbn select[name="iBwLBBased"], select[name="iBwLBBased"]',
    text: 'Bước 3: chọn Session Based',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: '.ldbn select[name="iBwLBMode"], select[name="iBwLBMode"]',
    text: 'Bước 4: chọn According to Line Speed',
    position: 'right',
    page: 'mwangen1'
  },
  {
    selector: 'input[name="btnOk"], input[value="OK"]',
    text: 'Bước 5: chọn OK để lưu cấu hình, sau đó cấu hình tiếp WAN1 và WAN2.',
    position: 'top',
    page: 'mwangen1'
  },
  /* Trang WAN1 (doc/mwangen.htm) — dùng 'mwangen.htm' (có đuôi .htm) để KHÔNG bị trùng
     với trang tổng 'mwangen1.htm' (so khớp theo chuỗi con: "mwangen.htm" không nằm
     trong "mwangen1.htm" vì có số 1 chen giữa). */
  {
    selector: 'input[name="sBwWanDisName"]',
    text: 'Bước 1: nhập ISP-1',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBInRateUnit"]',
    text: 'Bước 2: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'select[name="uilBwLBOutRateUnit"]',
    text: 'Bước 3: nhập 80 Mbps',
    position: 'right',
    page: 'mwangen.htm'
  },
  {
    selector: 'input[name="submit"], input[value="OK"]',
    text: 'Bước 4: chọn OK',
    position: 'top',
    page: 'mwangen.htm'
  }
];

