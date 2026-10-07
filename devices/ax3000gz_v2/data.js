/** Cấu hình portal cho AX3000GZ V2 / ZTE F6201B. */
window.DEVICE_AX3000GZ_V2 = {
  id: 'ax3000gz_v2',
  name: 'ONT AX3000GZ V2',
  shortName: 'AX3000GZ V2',
  model: 'ZTE F6201B',
  port: 8097,
  folder: 'sim_ax3000gz_v2',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_ax3000gz_v2/',
  categories: [
    { title: 'HỌC TẬP', lessons: window.DEVICE_AX3000GZ_V2_LESSONS || [] }
  ]
};
