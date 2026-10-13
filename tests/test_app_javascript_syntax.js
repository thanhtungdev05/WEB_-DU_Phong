'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appPath = path.resolve(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

assert.doesNotThrow(
  () => new vm.Script(source, { filename: appPath }),
  'app.js must remain valid JavaScript'
);

console.log('app.js syntax check passed.');
