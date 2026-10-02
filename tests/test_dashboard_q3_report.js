const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'reports', 'dashboard-q3-2026.html');
const report = fs.readFileSync(reportPath, 'utf8');

assert.match(report, /data-source="db-backup-snapshot"/);
assert.match(report, /data-query-count="1"/);
assert.match(report, /01\/07\/2026 — 28\/09\/2026/);
assert.match(report, />1\.000</);
assert.match(report, />48</);
assert.match(report, />81,1%</);
assert.match(report, />69,13%</);
assert.match(report, />92,51%</);
assert.match(report, /716 \/ 774 assignment/);
assert.match(report, />12</);
assert.match(report, />79</);
assert.match(report, /11,1 lượt\/ngày/);
assert.match(report, /76,9 lượt\/tuần/);
assert.match(report, /Mục tiêu đề xuất Q4/);
assert.match(report, /Số kế hoạch minh họa/);
assert.match(report, /@media print/);

assert.doesNotMatch(report, /fetch\s*\(/);
assert.doesNotMatch(report, /\/api\//);
assert.doesNotMatch(report, /DATABASE_URL|postgres(?:ql)?:\/\//i);
assert.doesNotMatch(report, /@[a-z0-9.-]+\.[a-z]{2,}/i);

console.log('dashboard Q3 report contract: ok');
