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
  'devices/ac1000z/tooltips.js',
  'devices/ac1000z/lessons.js',
  'devices/ac1000z/data.js'
];
modules.forEach(relative => {
  assert.ok(portal.includes(`${relative}?v=${hash16(relative)}`), `${relative} must have its content hash in portal.html`);
});
assert.ok(portal.indexOf(modules[0]) < portal.indexOf(modules[1]), 'tooltips must load before lessons');
assert.ok(portal.indexOf(modules[1]) < portal.indexOf(modules[2]), 'lessons must load before device data');

const context = vm.createContext({ window: {} });
modules.forEach(relative => vm.runInContext(read(relative), context, { filename: relative }));
vm.runInContext(read('devices/index.js'), context, { filename: 'devices/index.js' });

const device = context.window.DEVICE_AC1000Z;
assert.ok(device, 'DEVICE_AC1000Z must be registered');
assert.strictEqual(device.id, 'ac1000z');
assert.strictEqual(device.folder, 'sim_ac1000z');
assert.strictEqual(device.loginUrl, '/sim_ac1000z/');
assert.ok(context.window.DEVICES.includes(device), 'devices/index.js must expose AC1000Z');

const lessons = context.window.DEVICE_AC1000Z_LESSONS;
assert.strictEqual(lessons.length, 6, 'AC1000Z must expose exactly the six standard ZTE labs');
lessons.forEach((lesson, index) => {
  const expectedId = `LAB_AC1000Z_${String(index + 1).padStart(2, '0')}`;
  assert.strictEqual(lesson.id, expectedId);
  assert.ok(Array.isArray(lesson.instructions) && lesson.instructions.length >= 2, `${expectedId} needs instructions`);
  assert.ok(Array.isArray(lesson.guidePopups) && lesson.guidePopups.length >= 5, `${expectedId} needs step-by-step tooltips`);
  assert.ok(lesson.grading && lesson.grading.rules.length > 0, `${expectedId} needs grading rules`);
  assert.ok(lesson.practiceUrl.startsWith('/sim_ac1000z/'), `${expectedId} must target the new simulator`);

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

const portForwardingLesson = lessons.find(lesson => lesson.id === 'LAB_AC1000Z_06');
const portForwardingSelectors = Array.from(
  portForwardingLesson.grading.rules,
  rule => rule.selector
);
assert.ok(portForwardingSelectors.includes('[id^="ExternalPortEndRange"]'), 'lab 6 must grade WAN end port');
assert.ok(portForwardingSelectors.includes('[id^="InternalPortEndRange"]'), 'lab 6 must grade LAN end port');
const portForwardingGuideSelectors = Array.from(
  context.window.TOOLTIPS_AC1000Z.LAB_AC1000Z_06,
  step => step.selector
);
assert.ok(portForwardingGuideSelectors.includes('[id^="ExternalPortEndRange"]'), 'lab 6 must guide WAN end port');
assert.ok(portForwardingGuideSelectors.includes('[id^="InternalPortEndRange"]'), 'lab 6 must guide LAN end port');

const login = context.window.TOOLTIPS_AC1000Z._common_login;
assert.deepStrictEqual(Array.from(login, item => item.selector), ['#Frm_Username', '#Frm_Password', '#LoginId']);
login.forEach(item => assert.ok(!/Bước\s+\d+/i.test(item.text), 'login actions must not be numbered lab steps'));

const wanLesson = lessons.find(lesson => lesson.id === 'LAB_AC1000Z_01');
assert.deepStrictEqual(
  Array.from(wanLesson.grading.rules, rule => rule.selector),
  ['[id="UserName:0"]', '[id="Password:0"]'],
  'lab 1 must grade the existing internet_tr069 interface, not a newly-created interface'
);

const wifiLesson = lessons.find(lesson => lesson.id === 'LAB_AC1000Z_02');
assert.ok(!wifiLesson.grading.rules.some(rule => rule.id === 'wifi_security'), 'lab 2 must keep Encryption Type at its default');
assert.ok(!wifiLesson.guidePopups.some(item => item.selector === '[id="EncryptionType:0"]'), 'lab 2 must not guide a needless Encryption Type change');
assert.ok(wifiLesson.guidePopups.some(item => item.selector === '[id="instName_WLANSSIDConf:0"]'), 'lab 2 must visibly guide opening SSID1 before editing it');

const dhcpLesson = lessons.find(lesson => lesson.id === 'LAB_AC1000Z_05');
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
const openExistingWan = context.window.TOOLTIPS_AC1000Z.LAB_AC1000Z_01.find(item => item.selector === '[id="instName_Internet:0"]');
assert.strictEqual(openExistingWan.condition(collapsedWanDoc), true, 'collapsed WAN fields must not hide the internet_tr069 opening guide');

const visibleDoc = {
  _ftcIsSaved: false,
  defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) },
  querySelector: () => visibleElement()
};
const simultaneousSelectors = {
  LAB_AC1000Z_01: ['[id="UserName:0"]', '[id="Password:0"]', '[id="Btn_apply_internet:0"]'],
  LAB_AC1000Z_02: ['[id="ESSID:0"]', '[id="Btn_apply_WLANSSIDConf:0"]'],
  LAB_AC1000Z_03: ['[id="ESSID:3"]', '[id="EncryptionType:3"]', '[id="Btn_apply_WLANSSIDConf:3"]'],
  LAB_AC1000Z_04: ['#sub_DNSServer10', '#sub_DNSServer20', '#Btn_apply_DHCPBasicCfg'],
  LAB_AC1000Z_05: ['[id="sub_IPAddr0:DHCPBasicCfg"]', '#sub_SubMask0', '[id="sub_MinAddress0:DHCPBasicCfg"]', '[id="sub_MaxAddress0:DHCPBasicCfg"]', '#Btn_apply_DHCPBasicCfg'],
  LAB_AC1000Z_06: ['[id^="Alias"]', '[id^="S_Interface"]', '[id^="Protocol"]', '[id^="InternalClient"]', '[id^="ExternalPort"]:not([id*="EndRange"])', '[id^="ExternalPortEndRange"]', '[id^="InternalPort"]:not([id*="EndRange"])', '[id^="InternalPortEndRange"]', '[id^="Btn_apply_PortForwarding"]']
};
Object.entries(simultaneousSelectors).forEach(([labId, selectors]) => {
  const items = context.window.TOOLTIPS_AC1000Z[labId];
  selectors.forEach(selector => {
    const item = items.find(candidate => candidate.selector === selector);
    assert.ok(item, `${labId} must guide ${selector}`);
    assert.strictEqual(item.condition(visibleDoc), true, `${labId} must show ${selector} together with other visible fields`);
  });
});

const migration = read('api/migrations/061_activate_ac1000z_catalog.sql');
assert.ok(migration.includes("'DEV_AC1000Z'"));
lessons.forEach(lesson => assert.ok(migration.includes(`'${lesson.id}'`), `${lesson.id} must be activated in catalog`));
assert.ok(!migration.includes("'LAB_AC1000Z_07'"), 'catalog must contain only six AC1000Z labs');
assert.ok(!/\bDELETE\s+FROM\b/i.test(migration), 'catalog migration must not delete persisted data');

const shellPages = [
  'simulators/ac1000z/src/www/login_page.html',
  'simulators/ac1000z/src/www/index.html'
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
walk(path.join(root, 'simulators/ac1000z/src/www')).forEach(file => {
  if (!/\.(html|js)$/.test(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  assert.ok(!/top\.location\.href\s*=/.test(source), `${path.relative(root, file)} must reload inside the portal iframe instead of the top window`);
});

const appJs = read('app.js').replace(/\r\n/g, '\n');
const loginPage = read('simulators/ac1000z/src/www/login_page.html');
const indexPage = read('simulators/ac1000z/src/www/index.html');
assert.ok(loginPage.includes('id="Frm_Username"'), 'login page must be detected as a login page');
assert.ok(loginPage.includes('id="LoginId"'), 'AC1000Z login button is the input the listeners must skip');
assert.ok(!indexPage.includes('Frm_Username'), 'index page must not be treated as a login page');
assert.ok(
  appJs.includes("currentDeviceId === 'ac1000z'"),
  'AC1000Z fields must stay editable instead of relying on the desktop-only readonly autofill hack'
);
assert.ok(
  appJs.includes("else if (currentDeviceId === 'ac1000z') {\n      layoutGuidePopupsWithoutOverlap(doc, renderedGuides);"),
  'collision-safe tooltip layout must be enabled for AC1000Z'
);

// Dismiss wait tip on AJAX navigation
const ajaxPageGet = indexPage.slice(
  indexPage.indexOf('function AjaxPageGet'),
  indexPage.indexOf('function AjaxQuery_ClassMenuClick')
);
const ajaxPageSuccess = ajaxPageGet.slice(
  ajaxPageGet.indexOf('pageContainer.succfunction'),
  ajaxPageGet.indexOf('pageContainer.errorfunction')
);
assert.ok(
  ajaxPageSuccess.includes('showWaitTip(false);'),
  'successful AC1000Z menu navigation must dismiss the blocking wait overlay'
);

// Session reset
const serverSource = read('simulators/ac1000z/src/server.py');
const storeSource = read('simulators/ac1000z/src/config_store.py');
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
  const resetAt = body.indexOf('_is_reset_path(parsed.path)');
  const sessionAt = body.indexOf('self.get_session()');
  assert.ok(resetAt > 0, `${name} must handle /api/reset`);
  assert.ok(sessionAt > resetAt, `${name} must reset the session before creating one`);
});
assert.ok(serverSource.includes('SESSIONS.pop(sid, None)'), '/api/reset must drop only the caller session');
assert.ok(serverSource.includes('Max-Age=0') || serverSource.includes('clear_sid=True'), '/api/reset must expire the SID cookie');
assert.ok(!serverSource.includes('SESSIONS.clear()'), '/api/reset must not wipe every session');
assert.ok(/def reset\(self\)/.test(storeSource), 'ConfigStore must be resettable');

console.log('AC1000Z portal registration tests passed.');
