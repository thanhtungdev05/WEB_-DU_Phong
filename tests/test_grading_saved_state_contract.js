'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const portalApp = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');

// A simulator save notification proves persistence only. It must not replace
// the lesson's value-by-value grading or suppress unexpected-change checks.
assert.match(portalApp, /let isSaved = hasStoredNotification/);
assert.doesNotMatch(
  portalApp,
  /if\s*\(hasStoredNotification\)\s*\{\s*isMatch\s*=\s*true/s,
);
assert.doesNotMatch(
  portalApp,
  /const passed\s*=\s*hasStoredNotification\s*\|\|/,
);
assert.doesNotMatch(
  portalApp,
  /if\s*\(!hasStoredNotification\)\s*\{\s*allDocs\.forEach/s,
);
assert.match(
  portalApp,
  /const criteria\s*=\s*rules;[\s\S]*?const passed\s*=\s*\(passedCount === criteria\.length\)\s*&&\s*!hasUnexpected/,
);

console.log('Saved-state grading contract passed.');
