'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const simulatorRoot = path.join(root, 'simulators', 'sim_ONT_be6500c', 'src', 'www');
const wifiApi = fs.readFileSync(path.join(simulatorRoot, 'wifi_api.js'), 'utf8');

for (const page of [
  'wifi__general.html',
  'wifi__general__t0.html',
  'wifi__general__t1.html',
  'wifi__general__t2.html',
]) {
  const html = fs.readFileSync(path.join(simulatorRoot, page), 'utf8');
  assert.match(html, /<link rel="stylesheet" href="\/css_nut_save\.css">/);
  assert.match(html, /<form[^>]+class="css-1w5zf2q"/);
  assert.match(html, /<script src="\/wifi_api\.js"><\/script>/);
}

assert.match(wifiApi, /function themNutThat\(\)/);
assert.match(wifiApi, /data-sim-save/);
assert.match(wifiApi, />Save<\/span>/);
assert.match(wifiApi, /\[role="tabpanel"\]:not\(\[hidden\]\) form, form/);
assert.match(
  wifiApi,
  /\.catch\([\s\S]*?\.then\(function \(\) \{[\s\S]*?themNutThat\(\);[\s\S]*?\}\);/,
  'Save must still be rendered when loading the simulator state fails.'
);

console.log('AP BE6500C Save contract passed.');
