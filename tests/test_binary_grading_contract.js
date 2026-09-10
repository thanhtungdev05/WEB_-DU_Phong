'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
const portalApp = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const adminDashboard = fs.readFileSync(path.join(root, 'dashboard-authen/js/app.js'), 'utf8');
const adminDashboardHtml = fs.readFileSync(path.join(root, 'dashboard-authen/index.html'), 'utf8');
const personalDashboard = fs.readFileSync(path.join(root, 'assets/personal-dashboard.js'), 'utf8');
const personalDashboardHtml = fs.readFileSync(path.join(root, 'personal-dashboard.html'), 'utf8');
const trainingApi = fs.readFileSync(path.join(root, 'api/lib/training_classes.php'), 'utf8');

assert.doesNotMatch(portal, /gm-score-(?:badge|num|denom)/);
assert.doesNotMatch(portalApp, /payload\.score|const score =/);
assert.match(portalApp, /passedCount === criteria\.length/);
assert.match(portalApp, /gradable: false/);
assert.match(portalApp, /Bài thực hành chưa có đủ tiêu chí chấm nên kết quả không được ghi nhận/);
assert.match(portalApp, /payload\.is_passed = evalResult\.passed/);

assert.match(adminDashboard, /session\.isPassed === true/);
assert.doesNotMatch(adminDashboard, /session\.score|item\.score|100 điểm/);
assert.doesNotMatch(adminDashboardHtml, /100 điểm|Điểm số|Điểm trung bình/);

assert.match(personalDashboard, /practice_pass_rate_percent/);
assert.match(personalDashboard, /pass_rate_percent/);
assert.doesNotMatch(personalDashboard, /score/i);
assert.doesNotMatch(personalDashboardHtml, /score|Điểm số|Điểm trung bình|Thang điểm/i);
assert.doesNotMatch(trainingApi, /average_score|avg_score/);
assert.match(trainingApi, /practice_pass_rate_percent/);

console.log('Binary pass/fail grading contract audit passed.');
