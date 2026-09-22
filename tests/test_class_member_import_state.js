'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dashboard = fs.readFileSync(
  path.resolve(__dirname, '..', 'dashboard-authen', 'js', 'app.js'),
  'utf8',
);

// Class member import (file KTV khi tạo lớp) must never stay in the transient
// "đang kiểm tra..." state when the preview fails or reports row errors.
// The info label must reach a terminal state in every path.

assert.match(dashboard, /async function previewClassMembers\(file\)/);
assert.match(dashboard, /đang kiểm tra\.\.\.`;/);

// 1. Preview returns row errors → label must be updated before the early return.
assert.match(
  dashboard,
  /if \(data\.errors && data\.errors\.length > 0\) \{[\s\S]*?if \(info\) info\.textContent = `\$\{file\.name\} — file có lỗi[\s\S]*?showToast\(`File KTV không hợp lệ[\s\S]*?return;\s*\}/,
);

// 2. Unexpected request/parse failure → label must be updated in the catch block.
assert.match(
  dashboard,
  /\} catch \(error\) \{\s*if \(info\) info\.textContent = `\$\{file\.name\} — không đọc được file[\s\S]*?showToast\(`Không thể đọc file KTV/,
);

// 3. Valid members must still be processed after the error guard, and the
//    success label must always be set.
assert.match(dashboard, /\(data\.members \|\| \[\]\)\.forEach\(member => \{/);
assert.match(dashboard, /Đã nạp \$\{total\} KTV`;/);

// 4. The busy flag must be reset on every path (finally).
assert.match(
  dashboard,
  /\} catch \(error\) \{[\s\S]*?\} finally \{\s*state\.classMemberImportBusy = false;/,
);

console.log('Class member import state contract passed.');