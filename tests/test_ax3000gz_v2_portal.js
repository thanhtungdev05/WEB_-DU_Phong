const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash16 = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex').slice(0, 16);

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

console.log('AX3000GZ V2 portal registration tests passed.');
