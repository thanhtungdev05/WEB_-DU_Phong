'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');

assert.match(source, /function applyGuidePopups\(\)/, 'guide mode must expose its tooltip injector');
const getCurrentLessonSource = source.match(
  /function getCurrentLesson\(\)\s*\{([\s\S]*?)\n  \}\n\n  function applyGuidePopups/
);
assert.ok(getCurrentLessonSource, 'getCurrentLesson must end before the tooltip injector');
assert.doesNotMatch(
  getCurrentLessonSource[1],
  /getCurrentLesson\(\)/,
  'getCurrentLesson must not recursively call itself instead of resolving the active lesson'
);

function createElement() {
  return {
    addEventListener() {},
    append() {},
    appendChild() {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    dataset: {},
    replaceChildren() {},
    setAttribute() {},
    style: {},
  };
}

const document = {
  body: { dataset: {} },
  createElement,
  getElementById: createElement,
};
const sandbox = {
  console,
  crypto: { randomUUID: () => 'test-uuid' },
  document,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ user: null }) }),
  localStorage: { getItem() { return null; }, removeItem() {}, setItem() {} },
  Promise,
  sessionStorage: { getItem() { return null; }, removeItem() {}, setItem() {} },
  setInterval() { return 1; },
  setTimeout() { return 1; },
  window: null,
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.location = { hostname: 'localhost', origin: 'http://localhost', replace() {} };
sandbox.globalThis = sandbox;

assert.doesNotThrow(
  () => new vm.Script(source, { filename: 'app.js' }).runInNewContext(sandbox),
  'portal boot must not throw before loading the learning catalog'
);

console.log('Portal boot runtime smoke test passed.');
