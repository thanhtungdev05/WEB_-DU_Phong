/**
 * devices/index.js — Loader & Hợp nhất dữ liệu các thiết bị từ folder devices/
 */

(function () {
  'use strict';

  // Gom tất cả các thiết bị đã được nạp bởi các file JS riêng lẻ
  const DEVICES = [
    window.DEVICE_AC1000F,
    window.DEVICE_AC1000CV2,
    window.DEVICE_AX3000C,
    window.DEVICE_AX3000GZ,
    window.DEVICE_AX3000GZ_V2,
    window.DEVICE_AX3000HV2,
    window.DEVICE_AX3000S,
    window.DEVICE_AC1000HI,
    window.DEVICE_AC1000Z,
    window.DEVICE_BE12000,
    window.DEVICE_BE15000,
    window.DEVICE_VIGOR2927,
    window.DEVICE_BE6500C,
    window.DEVICE_ONT_BE6500C,
    window.DEVICE_MIKROTIK_HEXS,
  ].filter(Boolean);

  // Mapping thiết bị chạy cùng cổng (cần server riêng)
  const DEVICE_CONFLICT_PORTS = {
    8080: ['ac1000f', 'ax3000hv2', 'ax3000s'],
  };

  // Export toàn cục
  window.DEVICES = DEVICES;
  window.DEVICE_CONFLICT_PORTS = DEVICE_CONFLICT_PORTS;
})();
