const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash16 = relative => {
  const absolute = path.join(root, relative);
  let content = fs.readFileSync(absolute);
  if (/\.(?:css|js|svg)$/i.test(absolute)) {
    content = Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  }
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
};

const portal = read('portal.html');
const modules = [
  'devices/ax3000gz_v2/tooltips.js',
  'devices/ax3000gz_v2/lessons.js',
  'devices/ax3000gz_v2/data.js'
];
modules.forEach(relative => {
  assert.ok(portal.includes(`${relative}?v=${hash16(relative)}`), `${relative} must have its content hash in portal.html`);
});
assert.ok(portal.indexOf(modules[0]) < portal.indexOf(modules[1]), 'tooltips must load before lessons');
assert.ok(portal.indexOf(modules[1]) < portal.indexOf(modules[2]), 'lessons must load before device data');

const context = vm.createContext({ window: {} });
modules.forEach(relative => vm.runInContext(read(relative), context, { filename: relative }));
vm.runInContext(read('devices/index.js'), context, { filename: 'devices/index.js' });

const device = context.window.DEVICE_AX3000GZ_V2;
assert.ok(device, 'DEVICE_AX3000GZ_V2 must be registered');
assert.strictEqual(device.id, 'ax3000gz_v2');
assert.strictEqual(device.folder, 'sim_ax3000gz_v2');
assert.strictEqual(device.loginUrl, '/sim_ax3000gz_v2/');
assert.ok(context.window.DEVICES.includes(device), 'devices/index.js must expose AX3000GZ V2');

const lessons = context.window.DEVICE_AX3000GZ_V2_LESSONS;
assert.strictEqual(lessons.length, 6, 'AX3000GZ V2 must expose exactly the six standard AX3000GZ lessons');
lessons.forEach((lesson, index) => {
  const expectedId = `LAB_AX3000GZ_V2_${String(index + 1).padStart(2, '0')}`;
  assert.strictEqual(lesson.id, expectedId);
  assert.ok(Array.isArray(lesson.instructions) && lesson.instructions.length >= 2, `${expectedId} needs instructions`);
  assert.ok(Array.isArray(lesson.guidePopups) && lesson.guidePopups.length >= 5, `${expectedId} needs step-by-step tooltips`);
  assert.ok(lesson.grading && lesson.grading.rules.length > 0, `${expectedId} needs grading rules`);
  assert.ok(lesson.practiceUrl.startsWith('/sim_ax3000gz_v2/'), `${expectedId} must target the new simulator`);
});

const login = context.window.TOOLTIPS_AX3000GZ_V2._common_login;
assert.deepStrictEqual(Array.from(login, item => item.selector), ['#Frm_Username', '#Frm_Password', '#LoginId']);

const selectorSources = {
  LAB_AX3000GZ_V2_01: 'devices/ax3000gz_v2/src/www/api/ethWanConfig.html',
  LAB_AX3000GZ_V2_02: 'devices/ax3000gz_v2/src/www/api/wlanBasic.html',
  LAB_AX3000GZ_V2_03: 'devices/ax3000gz_v2/src/www/api/wlanBasic.html',
  LAB_AX3000GZ_V2_04: 'devices/ax3000gz_v2/src/www/api/dns.html',
  LAB_AX3000GZ_V2_05: 'devices/ax3000gz_v2/src/www/api/lanMgrIpv4.html',
  LAB_AX3000GZ_V2_06: 'devices/ax3000gz_v2/src/www/api/portForwarding.html'
};
const requiredMarkers = {
  LAB_AX3000GZ_V2_01: ['id="UserName"', 'id="Password"'],
  LAB_AX3000GZ_V2_02: ['id="ESSID"', 'id="HiddenKeyPass"'],
  LAB_AX3000GZ_V2_03: ['id="ESSID"', 'id="HiddenKeyPass"'],
  LAB_AX3000GZ_V2_04: ['id="sub_SerIPAddress10"', 'id="sub_SerIPAddress23"'],
  LAB_AX3000GZ_V2_05: ['id="ServerEnable1"', 'id="sub_IPAddr0:DHCPBasicCfg"'],
  LAB_AX3000GZ_V2_06: ['id="InternalClient"', 'id="ExternalPort"']
};
Object.entries(selectorSources).forEach(([labId, relative]) => {
  const html = read(relative);
  requiredMarkers[labId].forEach(marker => assert.ok(html.includes(marker), `${labId} selector marker ${marker} must exist`));
});

const migration = read('api/migrations/055_activate_ax3000gz_v2_catalog.sql');
assert.ok(migration.includes("'DEV_AX3000GZ_V2'"));
lessons.forEach(lesson => assert.ok(migration.includes(`'${lesson.id}'`), `${lesson.id} must be activated in catalog`));
assert.ok(!migration.includes("'LAB_AX3000GZ_V2_07'"), 'catalog must contain only six AX3000GZ V2 labs');
assert.ok(!/\bDELETE\s+FROM\b/i.test(migration), 'catalog migration must not delete persisted data');

const shellPages = [
  'devices/ax3000gz_v2/src/www/login_page.html',
  'devices/ax3000gz_v2/src/www/common_page.html'
];
shellPages.forEach(relative => {
  const html = read(relative);
  assert.ok(!/if\s*\(\s*top\s*!=\s*self\s*\)/.test(html), `${relative} must not break out of the portal iframe`);
  assert.ok(html.includes('if(false && top != self)'), `${relative} keeps the original frame-buster disabled`);
});

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
walk(path.join(root, 'devices/ax3000gz_v2/src/www')).forEach(file => {
  if (!/\.(html|js)$/.test(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  assert.ok(!/top\.location\.href\s*=/.test(source), `${path.relative(root, file)} must reload inside the portal iframe instead of the top window`);
});

// Nút Login là <input type="submit"> nên 2 listener bắt Save/Apply trong app.js
// phải bỏ qua trang đăng nhập, nếu không chế độ Hướng dẫn sẽ bật "Xem lỗi sai"
// ngay khi học viên bấm Login mà chưa cấu hình gì.
const appJs = read('app.js');
const loginPage = read('devices/ax3000gz_v2/src/www/login_page.html');
const commonPage = read('devices/ax3000gz_v2/src/www/common_page.html');
assert.ok(
  (appJs.match(/^\s*if \(isLogin\) return;$/gm) || []).length >= 2,
  'both Save/Apply listeners in app.js must ignore login pages'
);
assert.ok(loginPage.includes('id="Frm_Username"'), 'login page must be detected as a login page');
assert.ok(loginPage.includes('id="LoginId"'), 'AX3000GZ V2 login button is the input the listeners must skip');
assert.ok(!commonPage.includes('Frm_Username'), 'common page must not be treated as a login page');

// Mỗi lần chuyển menu, firmware bật lớp chờ trước khi gọi AJAX. Lớp này phải
// được tắt ngay ở nhánh thành công; nếu không trang đã render nhưng toàn bộ
// giao diện vẫn bị màn xám + vòng xoay che kín (đặc biệt dễ thấy trên Safari).
const ajaxPageGet = commonPage.slice(
  commonPage.indexOf('function AjaxPageGet'),
  commonPage.indexOf('function AjaxQuery_ClassMenuClick')
);
const ajaxPageSuccess = ajaxPageGet.slice(
  ajaxPageGet.indexOf('pageContainer.succfunction'),
  ajaxPageGet.indexOf('pageContainer.errorfunction')
);
assert.ok(
  ajaxPageSuccess.includes('showWaitTip(false);'),
  'successful AX3000GZ V2 menu navigation must dismiss the blocking wait overlay'
);

// Đổi bài: portal gọi /sim_ax3000gz_v2/api/reset (POST trước, GET dự phòng)
// nên server của thiết bị phải xử lý cả hai verb và xóa SID + ConfigStore.
const serverSource = read('devices/ax3000gz_v2/src/server.py');
const storeSource = read('devices/ax3000gz_v2/src/config_store.py');
assert.ok(serverSource.includes('"/api/reset"'), 'simulator must expose /api/reset');
const handlerBody = (source, name) => {
  const start = source.indexOf(`def ${name}(self):`);
  assert.ok(start >= 0, `server.py must define ${name}`);
  const rest = source.slice(start);
  const next = rest.indexOf('\n    def ', 1);
  return next >= 0 ? rest.slice(0, next) : rest;
};
['do_GET', 'do_POST'].forEach(name => {
  const body = handlerBody(serverSource, name);
  const resetAt = body.indexOf('_is_reset_path(u.path)');
  const sessionAt = body.indexOf('_session(create=True)');
  assert.ok(resetAt > 0, `${name} must handle /api/reset`);
  assert.ok(sessionAt > resetAt, `${name} must reset the session before creating one`);
});
assert.ok(serverSource.includes('SESSIONS.pop(sid, None)'), '/api/reset must drop only the caller session');
assert.ok(serverSource.includes('clear_sid=True'), '/api/reset must expire the SID cookie');
assert.ok(!serverSource.includes('SESSIONS.clear()'), '/api/reset must not wipe every session');
assert.ok(/def reset\(self\)/.test(storeSource), 'ConfigStore must be resettable');

console.log('AX3000GZ V2 portal registration tests passed.');
