/**
 * devices/vigor2927/tooltips/bai4.js — Tooltip Hướng dẫn cho Bài 4: Cấu hình DHCP
 */

if (!window.TOOLTIPS_VIGOR2927) window.TOOLTIPS_VIGOR2927 = {};

function isVigor2927Bai4IpDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sLanIp"]');
  return el ? (el.value || '').trim() === '192.168.100.1' : false;
}

function isVigor2927Bai4MaskDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('select[name="sLanMask"]');
  if (!el) return false;
  var opt = el.options[el.selectedIndex];
  var txt = opt ? (opt.text || opt.value || '') : el.value;
  return txt.includes('255.255.255.0');
}

function hookVigor2927DhcpEvents(doc) {
  if (!doc || doc._ftcDhcpHooked) return;
  doc._ftcDhcpHooked = true;
  var radio = doc.querySelector('input[name="sDHCP"][value="1"]');
  if (radio && typeof radio.addEventListener === 'function') {
    radio.addEventListener('click', function() { doc._ftcDhcpConfirmed = true; });
    radio.addEventListener('change', function() { doc._ftcDhcpConfirmed = true; });
  }
  var startIp = doc.querySelector('input[name="sDHCPStIP"]');
  if (startIp && typeof startIp.addEventListener === 'function') {
    startIp.addEventListener('focus', function() { doc._ftcDhcpConfirmed = true; });
    startIp.addEventListener('input', function() { doc._ftcDhcpConfirmed = true; });
  }
}

function isVigor2927Bai4DhcpConfirmed(doc) {
  if (!doc) return false;
  hookVigor2927DhcpEvents(doc);
  var radio = doc.querySelector('input[name="sDHCP"]:checked');
  var val = radio ? radio.value : '';
  if (val !== '1') return false;
  var startIpEl = doc.querySelector('input[name="sDHCPStIP"]');
  var startIpVal = startIpEl ? (startIpEl.value || '').trim() : '';
  return !!(doc._ftcDhcpConfirmed || startIpVal === '192.168.100.10');
}

function isVigor2927Bai4StartIpDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sDHCPStIP"]');
  return el ? (el.value || '').trim() === '192.168.100.10' : false;
}

function isVigor2927Bai4PoolDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="iDHCPNo"]');
  return el ? (el.value || '').trim() === '200' : false;
}

function isVigor2927Bai4GwDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sDHCPGwIP"]');
  return el ? (el.value || '').trim() === '192.168.100.1' : false;
}

function isVigor2927Bai4LeaseDone(doc) {
  if (!doc) return false;
  var el = doc.querySelector('input[name="sDHCPLsTime"]');
  return el ? (el.value || '').trim() === '86400' : false;
}

function isVigor2927Bai4AllInputsDone(doc) {
  return isVigor2927Bai4IpDone(doc) &&
         isVigor2927Bai4MaskDone(doc) &&
         isVigor2927Bai4StartIpDone(doc) &&
         isVigor2927Bai4PoolDone(doc) &&
         isVigor2927Bai4GwDone(doc) &&
         isVigor2927Bai4LeaseDone(doc);
}

window.TOOLTIPS_VIGOR2927['vg2927-bai4'] = [
  {
    selector: '#menu-lan:not(.open) .menu-text, #menu-lan:not(.open)',
    text: 'Bước 1: chọn LAN',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#sub-lan:not(.hidden) #menu-lan-general .menu-text, #sub-lan:not(.hidden) #menu-lan-general',
    text: 'Bước 2: chọn General Setup',
    position: 'bottom',
    hideOnPage: 'enet1|sht|enet'
  },
  {
    selector: '#lan1 input[name="btnDtPage0"], input[name="btnDtPage0"], #lan1 input[value="Details Page"]',
    text: 'Bước 3: chọn Details Page',
    position: 'top',
    hideOnPage: 'sht'
  },
  {
    selector: 'input[name="sLanIp"]',
    text: 'Bước 4: điền IP Address: 192.168.100.1',
    position: 'bottom',
    condition: function(doc) {
      return !isVigor2927Bai4IpDone(doc);
    }
  },
  {
    selector: 'select[name="sLanMask"]',
    text: 'Bước 5: chọn Subnet Mask: 255.255.255.0 / 24',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai4IpDone(doc) && !isVigor2927Bai4MaskDone(doc);
    }
  },
  {
    selector: 'input[name="sDHCP"][value="1"] + translate, input[name="sDHCP"][value="1"]',
    text: 'Bước 6: chọn Enable Server',
    position: 'top',
    minTop: -4,
    offsetY: 3,
    condition: function(doc) {
      return isVigor2927Bai4IpDone(doc) && isVigor2927Bai4MaskDone(doc) && !isVigor2927Bai4DhcpConfirmed(doc);
    }
  },
  {
    selector: 'input[name="sDHCPStIP"]',
    text: 'Bước 7: điền Start IP Address: 192.168.100.10',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai4IpDone(doc) && isVigor2927Bai4MaskDone(doc) && isVigor2927Bai4DhcpConfirmed(doc) && !isVigor2927Bai4StartIpDone(doc);
    }
  },
  {
    selector: 'input[name="iDHCPNo"]',
    text: 'Bước 8: điền IP Pool Counts: 200',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai4StartIpDone(doc) && !isVigor2927Bai4PoolDone(doc);
    }
  },
  {
    selector: 'input[name="sDHCPGwIP"]',
    text: 'Bước 9: điền Gateway IP Address: 192.168.100.1',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai4StartIpDone(doc) && isVigor2927Bai4PoolDone(doc) && !isVigor2927Bai4GwDone(doc);
    }
  },
  {
    selector: 'input[name="sDHCPLsTime"]',
    text: 'Bước 10: điền Lease Time: 86400',
    position: 'bottom',
    condition: function(doc) {
      return isVigor2927Bai4StartIpDone(doc) && isVigor2927Bai4PoolDone(doc) && isVigor2927Bai4GwDone(doc) && !isVigor2927Bai4LeaseDone(doc);
    }
  },
  {
    selector: 'input[name="btnOK"], input[value="OK"]',
    text: 'Bước 11: chọn OK để lưu cấu hình',
    position: 'top',
    condition: function(doc) {
      return isVigor2927Bai4AllInputsDone(doc) && !doc._ftcIsSaved;
    }
  }
];
