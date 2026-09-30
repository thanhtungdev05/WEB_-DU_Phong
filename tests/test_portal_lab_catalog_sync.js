'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const expected = {
  ac1000f: 'LAB_AC1000F_',
  ax3000c: 'LAB_AX3000CV2_',
  ax3000gz: 'LAB_AX3000GZ_',
  ax3000hv2: 'LAB_AX3000HV2_',
  ax3000s: 'LAB_AX3000S_',
  ac1000HI: 'LAB_AC1000HI_',
  be6500c: 'be6500c-bai',
  ONT_be6500c: 'ONT_be6500c-bai',
  vigor2927: 'vg2927-bai'
};
const supportedPortalDevices = [
  'ac1000f', 'ax3000c', 'ax3000gz', 'ax3000hv2', 'ax3000s',
  'ac1000HI', 'be12000', 'be15000', 'vigor2927', 'be6500c', 'ONT_be6500c',
  'mikrotik_hexs'
];
const simulatorPrefixes = {
  ac1000f: '/sim_ac1000f/',
  ax3000c: '/sim_ax3000c/',
  ax3000gz: '/sim_ax3000gz/',
  ax3000hv2: '/sim_ax3000hv2/',
  ax3000s: '/sim_ax3000s/',
  ac1000HI: '/sim_ac1000HI/',
  be6500c: '/sim_be6500c/',
  ONT_be6500c: '/sim_ONT_be6500c/',
  vigor2927: '/sim_vigor2927/'
};
const expectedTitles = [
  'Cấu hình PPPoE',
  'Cấu hình Wi-Fi',
  'Cấu hình Wi-Fi IoT',
  'Cấu hình DNS',
  'Cấu hình DHCP',
  'Cấu hình Port Forwarding',
  'Cấu hình Mesh wifi'
];
const be6500cTitles = [
  'Cấu hình PPPoE',
  'Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)',
  'Cấu hình mạng Wi-Fi IOT',
  'Cấu hình DNS',
  'Cấu hình mạng LAN',
  'Cấu hình Port Forwarding'
];
const vigor2927Titles = [
  'Cấu hình PPPoE',
  'Cấu hình giới hạn băng thông',
  'Cấu hình Bind IP to MAC',
  'Cấu hình DHCP',
  'Cấu hình DNS',
  'Cấu hình định tuyến Failover và Load Balancing',
  'Cấu hình Policy Routing'
];

function normalizeTitle(value) {
  return String(value)
    .replace(/^Bài\s+\d+\s*-\s*/iu, '')
    .replace(/wi[\s-]*fi/giu, 'wifi')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('vi');
}

assert.match(portal, /devices\/mikrotik_hexs\/lessons\/bai1\.js/);
assert.match(portal, /devices\/mikrotik_hexs\/data\.js/);
// BE12000 vẫn có module bài 7 trong registry để giữ mã nguồn mô phỏng,
// nhưng catalog production chỉ quyết định các bài active được hiển thị.
assert.doesNotMatch(portal, /\/lessons\/bai(?:[8-9]|10)\.js/);

const context = { console };
context.window = context;
vm.createContext(context);

const scripts = [...portal.matchAll(/<script\s+src="([^"]+\.js)(?:\?[^\"]*)?"/g)]
  .map((match) => match[1])
  .filter((relativePath) => relativePath.startsWith('devices/') || relativePath === 'data.js');
for (const relativePath of scripts) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

assert.deepEqual(
  Array.from(context.DEVICES, (device) => device.id),
  supportedPortalDevices,
  'Portal module registry must contain every device supported by the active catalog'
);

const migrations = [
  '030_enforce_approved_dashboard_catalog.sql',
  '036_activate_be6500c_catalog.sql',
  '046_activate_vigor2927_catalog.sql',
  '049_activate_mikrotik_hexs_catalog.sql',
  '051_activate_ax3000cv2_easymesh_lab.sql'
].map((file) => fs.readFileSync(path.join(root, 'api/migrations', file), 'utf8')).join('\n');
for (const device of context.DEVICES.filter((item) => Object.hasOwn(expected, item.id))) {
  const lessons = device.categories.flatMap((category) => category.lessons || []);
  const expectedLessonCount = (device.id === 'vigor2927' || device.id === 'ax3000c') ? 7 : 6;
  assert.equal(lessons.length, expectedLessonCount, `${device.id} must expose exactly ${expectedLessonCount} labs`);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, expectedLessonCount, `${device.id} lab IDs must be unique`);

  lessons.forEach((lesson, index) => {
    assert.match(
      lesson.practiceUrl || '',
      /^\/sim_[A-Za-z0-9_]+\//,
      `${lesson.id} must use a dispatcher-registered simulator URL`
    );
    assert.ok(
      lesson.practiceUrl.startsWith(simulatorPrefixes[device.id]),
      `${lesson.id} must preserve the dispatcher prefix including letter case`
    );
    assert.ok(
      Array.isArray(lesson.grading?.rules) && lesson.grading.rules.length > 0
        || typeof lesson.grading?.customGrading === 'function',
      `${lesson.id} must define explicit grading criteria`
    );
    const expectedId = expected[device.id].startsWith('LAB_')
      ? `${expected[device.id]}${String(index + 1).padStart(2, '0')}`
      : `${expected[device.id]}${index + 1}`;
    const expectedTitle = device.id === 'vigor2927'
      ? vigor2927Titles[index]
      : device.id === 'be6500c' || device.id === 'ONT_be6500c'
        ? be6500cTitles[index]
        : expectedTitles[index];
    assert.equal(lesson.id, expectedId, `${device.id} lab ${index + 1} uses an unexpected ID`);
    assert.equal(
      normalizeTitle(lesson.title),
      normalizeTitle(expectedTitle),
      `${expectedId} has an inconsistent display title`
    );
    assert.ok(migrations.includes(`'${expectedId}'`), `${expectedId} is missing from the active catalog migration`);

    const tooltipStore = context[`TOOLTIPS_${device.shortName.toUpperCase()}`] || {};
    const guide = tooltipStore[lesson.id]
      || (Array.isArray(lesson.guidePopups) && lesson.guidePopups.length > 0 ? lesson.guidePopups : null);
    assert.ok(Array.isArray(guide) && guide.length > 0, `${expectedId} must have a tooltip guide`);
  });
}

const be12000 = context.DEVICES.find((item) => item.id === 'be12000');
const be15000 = context.DEVICES.find((item) => item.id === 'be15000');
assert.ok(be12000?.categories.flatMap((category) => category.lessons || []).length >= 6);
assert.equal(be15000?.categories.flatMap((category) => category.lessons || []).length, 1);

const expectedLessonCounts = {
  ac1000f: 6,
  ax3000c: 7,
  ax3000gz: 6,
  ax3000hv2: 6,
  ax3000s: 6,
  ac1000HI: 6,
  be12000: 6,
  be15000: 1,
  vigor2927: 7,
  be6500c: 6,
  ONT_be6500c: 6,
  mikrotik_hexs: 7
};
for (const device of context.DEVICES) {
  const lessons = device.categories.flatMap((category) => category.lessons || []);
  assert.equal(lessons.length, expectedLessonCounts[device.id], `${device.id} has an unexpected lesson count`);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length, `${device.id} lab IDs must be unique`);
  for (const lesson of lessons) {
    assert.ok(lesson.practiceUrl?.startsWith(`/${device.folder}/`), `${lesson.id} must route to ${device.folder}`);
    assert.ok(
      (Array.isArray(lesson.grading?.rules) && lesson.grading.rules.length > 0) ||
        typeof lesson.grading?.customGrading === 'function',
      `${lesson.id} must define grading criteria`
    );
    assert.ok(migrations.includes(`'${lesson.id}'`) || device.id === 'be12000' || device.id === 'be15000',
      `${lesson.id} is missing from a device activation migration`);
  }
}

const activeCatalogMigration = fs.readFileSync(
  path.join(root, 'api/migrations/043_sync_portal_lab_catalog.sql'),
  'utf8'
);
const activeDeviceIds = [...activeCatalogMigration.matchAll(/^\s*\('(DEV_[^']+)',\s*'[^']+',\s*'[^']+',\s*\d+,\s*TRUE\)/gm)];
const activeLabIds = [...activeCatalogMigration.matchAll(/^\s*\('([^']+)',\s*'DEV_[^']+',\s*'[^']+',\s*\d+,\s*TRUE\)/gm)];
assert.equal(activeDeviceIds.length, 10, 'Catalog migration must activate ten portal devices');
assert.equal(activeLabIds.length, 55, 'Catalog migration must activate 55 portal labs');

function getLesson(deviceId, lessonId) {
  const device = context.DEVICES.find((item) => item.id === deviceId);
  return device.categories.flatMap((category) => category.lessons || [])
    .find((lesson) => lesson.id === lessonId);
}

function expectedRuleValue(lesson, ruleId) {
  return lesson.grading.rules.find((rule) => rule.id === ruleId)?.expected;
}

const ax3000cDns = getLesson('ax3000c', 'LAB_AX3000CV2_04');
assert.equal(expectedRuleValue(ax3000cDns, 'dns_custom_enable'), '1');
assert.equal(typeof ax3000cDns.customClear, 'function');

const ax3000cDhcp = getLesson('ax3000c', 'LAB_AX3000CV2_05');
assert.equal(ax3000cDhcp.clearFields, undefined, 'DHCP defaults must remain for automatic pool updates');

const ax3000cPortForward = getLesson('ax3000c', 'LAB_AX3000CV2_06');
assert.equal(expectedRuleValue(ax3000cPortForward, 'enable'), 'on');
assert.equal(expectedRuleValue(ax3000cPortForward, 'protocol'), 'TCP+UDP');
assert.deepEqual(Array.from(expectedRuleValue(ax3000cPortForward, 'int_ip')), ['Admin-PC (192.168.100.109 / d8:43:ae:2e:65:45)', '192.168.100.109']);

const ax3000gzPppoe = getLesson('ax3000gz', 'LAB_AX3000GZ_01');
assert.equal(expectedRuleValue(ax3000gzPppoe, 'pppoe_user'), 'sgfdl-123456-789');
const ax3000gzDns = getLesson('ax3000gz', 'LAB_AX3000GZ_04');
assert.equal(expectedRuleValue(ax3000gzDns, 'dns_primary'), '8.8.8.8');
assert.equal(expectedRuleValue(ax3000gzDns, 'dns_secondary'), '8.8.4.4');
const ax3000hv2Dns = getLesson('ax3000hv2', 'LAB_AX3000HV2_04');
assert.equal(expectedRuleValue(ax3000hv2Dns, 'dns_primary'), '8.8.8.8');
assert.equal(expectedRuleValue(ax3000hv2Dns, 'dns_secondary'), '8.8.4.4');
const ax3000gzPortForward = getLesson('ax3000gz', 'LAB_AX3000GZ_06');
assert.equal(expectedRuleValue(ax3000gzPortForward, 'pf_wan_ip'), '0.0.0.0/0');

const ax3000cServer = fs.readFileSync(
  path.join(root, 'simulators/sim_ax3000c/server_fw053.py'),
  'utf8'
);
assert.match(ax3000cServer, /AX3000CV2 firmware 0\.5\.3/);

console.log('Portal/catalog audit passed: 12 registered devices, 69 active catalog labs.');
