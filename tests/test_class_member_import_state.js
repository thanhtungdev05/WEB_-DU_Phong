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

// 1. Preview returns row errors → render the sheet/row context before the
//    early return and escape workbook-controlled text.
assert.match(dashboard, /function renderClassMemberImportErrors\(info, file, errors\)/);
assert.match(dashboard, /const visibleErrors = allErrors\.slice\(0, 100\);/);
assert.match(dashboard, /if \(sheet && row\) location = `Sheet \$\{sheet\}, dòng \$\{row\}`;/);
assert.match(dashboard, /escapeHTML\(location\)/);
assert.match(dashboard, /escapeHTML\(error\?\.message \|\| 'Dữ liệu không hợp lệ'\)/);
assert.match(
  dashboard,
  /if \(data\.errors && data\.errors\.length > 0\) \{[\s\S]*?renderClassMemberImportErrors\(info, file, data\.errors\);[\s\S]*?showToast\(`File KTV có \$\{data\.errors\.length\} lỗi\.[\s\S]*?return;\s*\}/,
);

const helperMatch = dashboard.match(
  /(function renderClassMemberImportErrors\(info, file, errors\) \{[\s\S]*?\n\})\n\nasync function previewClassMembers/,
);
assert.ok(helperMatch, 'Detailed import error renderer must be extractable for behavior testing.');
const escapeHTMLForTest = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
})[character]);
const renderImportErrors = new Function(
  'escapeHTML',
  `${helperMatch[1]}\nreturn renderClassMemberImportErrors;`,
)(escapeHTMLForTest);
const errorClasses = new Set();
const info = {
  hidden: true,
  innerHTML: '',
  classList: { add: className => errorClasses.add(className) },
};
renderImportErrors(info, { name: '<file>.xlsx' }, [
  { sheet: 'KTV<script>', row: 34, message: 'Tài khoản <b>đã nghỉ việc</b>.' },
  { sheet: null, row: 1, message: 'Thiếu cột bắt buộc.' },
]);
assert.equal(info.hidden, false);
assert.ok(errorClasses.has('is-error'));
assert.match(info.innerHTML, /&lt;file&gt;\.xlsx — 2 lỗi/);
assert.match(info.innerHTML, /Sheet KTV&lt;script&gt;, dòng 34/);
assert.match(info.innerHTML, /Dòng 1/);
assert.match(info.innerHTML, /Tài khoản &lt;b&gt;đã nghỉ việc&lt;\/b&gt;\./);
assert.doesNotMatch(info.innerHTML, /<script>|<b>/);

// 2. Unexpected request/parse failure → label must be updated in the catch block.
assert.match(
  dashboard,
  /\} catch \(error\) \{\s*if \(info\) \{[\s\S]*?info\.classList\.add\('is-error'\);[\s\S]*?info\.textContent = `\$\{file\.name\} — không đọc được file[\s\S]*?showToast\(`Không thể đọc file KTV/,
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
