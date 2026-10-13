'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');

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
