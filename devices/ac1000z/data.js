/** Cấu hình portal cho AC1000Z / ZTE F671Y. */
window.DEVICE_AC1000Z = {
  id: 'ac1000z',
  name: 'ONT AC1000Z',
  shortName: 'AC1000Z',
  model: 'ZTE F671Y',
  port: 8098,
  folder: 'sim_ac1000z',
  serverBat: 'chay_server.bat',
  needsServer: false,
  loginUrl: '/sim_ac1000z/',
  categories: [
    { title: 'HỌC TẬP', lessons: window.DEVICE_AC1000Z_LESSONS || [] }
  ]
};
