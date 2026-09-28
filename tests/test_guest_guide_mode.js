'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api', 'index.php'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const loginApp = fs.readFileSync(path.join(root, 'login', 'app.js'), 'utf8');
const loginPage = fs.readFileSync(path.join(root, 'login', 'index.html'), 'utf8');

// Guest mode is entered only for the explicit database connection error. A
// generic API/network failure must continue to fail closed and redirect to IAM.
assert.match(app, /error\.code === 'db-connect-error'/);
assert.match(app, /payload\.error\.code === 'db-connect-error'/);
assert.match(app, /A generic API\/network failure must not silently become an auth bypass\.[\s\S]*?return false;/);
assert.doesNotMatch(app, /response\.status\s*>=\s*500[\s\S]*?_guestGuideMode/);
assert.doesNotMatch(app, /urlParams\.get\('guest'\)/);
assert.match(loginApp, /errorCode !== 'db-connect-error'/);
assert.match(loginApp, /window\.location\.replace\('\/portal\.html\?guest=database-unavailable'\)/);
assert.match(loginApp, /IAM remains the only entry path for generic API\/network failures/);

// Offline lessons come only from the static, release-bundled device registry.
assert.match(app, /function loadStaticGuestGuideCatalog\(\)[\s\S]*?DEVICES\.forEach/);
assert.match(app, /_catalogLabIds\.add\(labId\)/);
assert.match(app, /populateDeviceDropdown\(visibleDevices\)/);

// Guest is UI state, not a fabricated IAM identity or elevated role.
assert.match(app, /function activateGuestGuideMode\(\)[\s\S]*?_currentUser = null;/);
assert.doesNotMatch(app, /function activateGuestGuideMode\(\)[\s\S]*?is_admin\s*:/);
assert.match(api, /function require_user\(\): array/);
assert.match(api, /fail\(401, 'auth\/unauthenticated'/);

// Guide (and, per current product decision, the still-visible Practice button)
// can open locally, but no guest result is sent to the tracking API.
assert.equal((app.match(/if \(!_currentUser && !_guestGuideMode\)/g) || []).length, 2);
assert.match(app, /if \(_guestGuideMode\) \{[\s\S]*?kết quả và tiến độ không được lưu/);
assert.match(app, /function sendTrackingTimer\([\s\S]*?if \(_guestGuideMode\) return Promise\.resolve\(false\);/);

assert.match(portal, /app\.js\?v=20260928-ver21-merge-v23/);
assert.match(loginPage, /app\.js\?v=20260922-guest-guide-mode/);
assert.match(portal, /\/assets\/logoFPT\.png\?v=20260924-fpt-telecom/);
assert.match(loginPage, /\/assets\/logoFPT\.png\?v=20260924-fpt-telecom/);

async function executeLoginPage(databasePayload, rejectHealthRequest = false) {
  const redirects = [];
  const label = { textContent: 'Đăng nhập bằng IAM' };
  const loginButton = {
    href: '/api/index.php/iam/login',
    classList: { add() {}, remove() {} },
    querySelector() { return label; },
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
  };
  const sandbox = {
    document: {
      getElementById(id) {
        assert.equal(id, 'iam-login');
        return loginButton;
      },
    },
    fetch() {
      if (rejectHealthRequest) return Promise.reject(new Error('network unavailable'));
      return Promise.resolve({
        json() { return Promise.resolve(databasePayload); },
      });
    },
    window: {
      location: {
        hostname: 'portal.example.test',
        origin: 'https://portal.example.test',
        replace(url) { redirects.push(url); },
      },
      addEventListener() {},
    },
    encodeURIComponent,
    Promise,
  };

  vm.runInNewContext(loginApp, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return redirects;
}

(async function runBehaviorChecks() {
  assert.deepEqual(
    await executeLoginPage({ error: { code: 'db-connect-error' } }),
    ['/portal.html?guest=database-unavailable'],
  );
  assert.deepEqual(await executeLoginPage({ ok: false, schemaReady: false }), []);
  assert.deepEqual(await executeLoginPage({}, true), []);
  console.log('Guest Guide Mode contract passed.');
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
