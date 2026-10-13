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

  const numberedSteps = Array.from(lesson.guidePopups)
    .map(item => /^Bước\s+(\d+):/.exec(item.text))
    .filter(Boolean)
    .map(match => Number(match[1]));
  assert.deepStrictEqual(
    numberedSteps,
    Array.from({ length: numberedSteps.length }, (_, stepIndex) => stepIndex + 1),
    `${expectedId} must not skip a visible step number`
  );
});

const portForwardingLesson = lessons.find(lesson => lesson.id === 'LAB_AX3000GZ_V2_06');
const portForwardingSelectors = Array.from(
  portForwardingLesson.grading.rules,
  rule => rule.selector
);
assert.ok(portForwardingSelectors.includes('[id^="ExternalPortEndRange"]'), 'lab 6 must grade WAN end port');
assert.ok(portForwardingSelectors.includes('[id^="InternalPortEndRange"]'), 'lab 6 must grade LAN end port');
const portForwardingGuideSelectors = Array.from(
  context.window.TOOLTIPS_AX3000GZ_V2.LAB_AX3000GZ_V2_06,
  step => step.selector
);
assert.ok(portForwardingGuideSelectors.includes('[id^="ExternalPortEndRange"]'), 'lab 6 must guide WAN end port');
assert.ok(portForwardingGuideSelectors.includes('[id^="InternalPortEndRange"]'), 'lab 6 must guide LAN end port');

const login = context.window.TOOLTIPS_AX3000GZ_V2._common_login;
assert.deepStrictEqual(Array.from(login, item => item.selector), ['#Frm_Username', '#Frm_Password', '#LoginId']);
login.forEach(item => assert.ok(!/Bước\s+\d+/i.test(item.text), 'login actions must not be numbered lab steps'));

const wanLesson = lessons.find(lesson => lesson.id === 'LAB_AX3000GZ_V2_01');
assert.deepStrictEqual(
  Array.from(wanLesson.grading.rules, rule => rule.selector),
  ['[id="UserName:0"]', '[id="Password:0"]'],
  'lab 1 must grade the existing internet_tr069 interface, not a newly-created interface'
);

const wifiLesson = lessons.find(lesson => lesson.id === 'LAB_AX3000GZ_V2_02');
assert.ok(!wifiLesson.grading.rules.some(rule => rule.id === 'wifi_security'), 'lab 2 must keep Encryption Type at its default');
assert.ok(!wifiLesson.guidePopups.some(item => item.selector === '[id="EncryptionType:0"]'), 'lab 2 must not guide a needless Encryption Type change');
assert.ok(wifiLesson.guidePopups.some(item => item.selector === '[id="instName_WLANSSIDConf:0"]'), 'lab 2 must visibly guide opening SSID1 before editing it');

const dhcpLesson = lessons.find(lesson => lesson.id === 'LAB_AX3000GZ_V2_05');
assert.strictEqual(dhcpLesson.grading.rules.length, 16, 'lab 5 must grade LAN IP, subnet, DHCP start and DHCP end');
assert.deepStrictEqual(Array.from(dhcpLesson.clearFields), [], 'lab 5 must preserve the firmware default IP values');
assert.ok(
  dhcpLesson.instructions.some(line => line.includes('Thực hiện thay đổi cấu hình địa chỉ IP LAN')),
  'lab 5 must use the tester-approved task wording'
);
['#sub_SubMask0', '[id="sub_MinAddress0:DHCPBasicCfg"]', '[id="sub_MaxAddress0:DHCPBasicCfg"]'].forEach(selector => {
  assert.ok(dhcpLesson.guidePopups.some(item => item.selector === selector), `lab 5 must guide ${selector}`);
});

const visibleElement = () => ({
  isConnected: true,
  nodeType: 1,
  parentElement: null,
  value: '',
  offsetParent: {},
  getClientRects: () => [{}],
  getBoundingClientRect: () => ({ width: 120, height: 28 })
});
const hiddenParent = { nodeType: 1, parentElement: null };
const collapsedField = { ...visibleElement(), parentElement: hiddenParent };
const wanListItem = visibleElement();
const collapsedWanDoc = {
  _ftcIsSaved: false,
  defaultView: {
    getComputedStyle: element => element === hiddenParent
      ? { display: 'none', visibility: 'visible' }
      : { display: 'block', visibility: 'visible' }
  },
  querySelector: selector => selector === '[id="instName_Internet:0"]' ? wanListItem : collapsedField
};
const openExistingWan = context.window.TOOLTIPS_AX3000GZ_V2.LAB_AX3000GZ_V2_01.find(item => item.selector === '[id="instName_Internet:0"]');
assert.strictEqual(openExistingWan.condition(collapsedWanDoc), true, 'collapsed WAN fields must not hide the internet_tr069 opening guide');

const visibleDoc = {
  _ftcIsSaved: false,
  defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) },
  querySelector: () => visibleElement()
};
const simultaneousSelectors = {
  LAB_AX3000GZ_V2_01: ['[id="UserName:0"]', '[id="Password:0"]', '[id="Btn_apply_internet:0"]'],
  LAB_AX3000GZ_V2_02: ['[id="ESSID:0"]', '[id="HiddenKeyPass:0"]', '[id="Btn_apply_WLANSSIDConf:0"]'],
  LAB_AX3000GZ_V2_03: ['[id="ESSID:3"]', '[id="EncryptionType:3"]', '[id="HiddenKeyPass:3"]', '[id="Btn_apply_WLANSSIDConf:3"]'],
  LAB_AX3000GZ_V2_04: ['#sub_SerIPAddress10', '#sub_SerIPAddress20', '#Btn_apply_LocalDnsServer'],
  LAB_AX3000GZ_V2_05: ['[id="sub_IPAddr0:DHCPBasicCfg"]', '#sub_SubMask0', '[id="sub_MinAddress0:DHCPBasicCfg"]', '[id="sub_MaxAddress0:DHCPBasicCfg"]', '#Btn_apply_DHCPBasicCfg'],
  LAB_AX3000GZ_V2_06: ['[id^="Alias"]', '[id^="S_Interface"]', '[id^="Protocol"]', '[id^="InternalClient"]', '[id^="ExternalPort"]:not([id*="EndRange"])', '[id^="ExternalPortEndRange"]', '[id^="InternalPort"]:not([id*="EndRange"])', '[id^="InternalPortEndRange"]', '[id^="Btn_apply_PortForwarding"]']
};
Object.entries(simultaneousSelectors).forEach(([labId, selectors]) => {
  const items = context.window.TOOLTIPS_AX3000GZ_V2[labId];
  selectors.forEach(selector => {
    const item = items.find(candidate => candidate.selector === selector);
    assert.ok(item, `${labId} must guide ${selector}`);
    assert.strictEqual(item.condition(visibleDoc), true, `${labId} must show ${selector} together with other visible fields`);
  });
});

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
  LAB_AX3000GZ_V2_05: ['id="sub_IPAddr0:DHCPBasicCfg"', 'id="sub_SubMask0"', 'id="sub_MinAddress0:DHCPBasicCfg"', 'id="sub_MaxAddress0:DHCPBasicCfg"'],
  LAB_AX3000GZ_V2_06: ['id="S_Interface"', 'id="InternalClient"', 'id="ExternalPort"']
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
assert.ok(
  appJs.includes("currentDeviceId === 'ax3000gz_v2'"),
  'AX3000GZ V2 fields must stay editable instead of relying on the desktop-only readonly autofill hack'
);
assert.ok(
  appJs.includes('_ftcGuideBurstSyncTimer'),
  'AX3000GZ V2 must refresh guide popups immediately after AJAX-triggering clicks'
);
assert.ok(
  appJs.includes("if (currentDeviceId === 'ax3000gz_v2') {\n      layoutGuidePopupsWithoutOverlap(doc, renderedGuides);"),
  'collision-safe tooltip layout must stay scoped to AX3000GZ V2'
);
assert.ok(
  appJs.includes('function layoutGuidePopupsWithoutOverlap(doc, guides)'),
  'AX3000GZ V2 must lay out simultaneous tooltips as one collision-aware group'
);
assert.ok(
  appJs.includes("'input:not([type=\"hidden\"]), select, textarea, button, [contenteditable=\"true\"]'"),
  'tooltip collision detection must protect editable fields and action controls'
);
assert.ok(
  appJs.includes('!occupied.some(rect => intersects(candidate, rect, collisionPadding))'),
  'tooltip collision detection must keep visible guide bubbles apart'
);
assert.ok(
  appJs.includes('range.selectNodeContents(textNode)')
    && appJs.includes('const protectedRects = controlRects.concat(textRects)')
    && appJs.includes('!protectedRects.some(rect => intersects(candidate, rect, collisionPadding))'),
  'tooltip collision detection must protect the rendered device text as well as form controls'
);

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
