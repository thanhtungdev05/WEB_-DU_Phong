const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const appJs = read('app.js');

const helperMatch = appJs.match(/function getAttemptRuleEvidence\(ruleId, attemptId, trackingSession\) \{[\s\S]*?\n  \}/);
assert.ok(helperMatch, 'the current-attempt evidence helper must exist');
const context = vm.createContext({});
vm.runInContext(`${helperMatch[0]}; this.getAttemptRuleEvidence = getAttemptRuleEvidence;`, context);
const evidence = context.getAttemptRuleEvidence;

const attemptOne = {
  attemptId: 'attempt-1',
  interactedRules: { wifi_ssid: 100 },
  savedAttemptId: 'attempt-1',
  lastSavedAt: 110
};
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(evidence('wifi_ssid', 'attempt-1', attemptOne))),
  { interactionAt: 100, savedAfterInteraction: true },
  'a genuine edit followed by Apply in the same attempt must be accepted'
);

assert.strictEqual(
  evidence('wifi_ssid', 'attempt-2', attemptOne).savedAfterInteraction,
  false,
  'evidence from attempt 1 must never pass attempt 2'
);
assert.strictEqual(
  evidence('wifi_ssid', 'attempt-2', {
    attemptId: 'attempt-2',
    interactedRules: {},
    savedAttemptId: 'attempt-2',
    lastSavedAt: 210
  }).savedAfterInteraction,
  false,
  'autofilled values plus Apply must fail without a current-attempt interaction'
);
assert.strictEqual(
  evidence('wifi_ssid', 'attempt-2', {
    attemptId: 'attempt-2',
    interactedRules: { wifi_ssid: 220 },
    savedAttemptId: 'attempt-2',
    lastSavedAt: 210
  }).savedAfterInteraction,
  false,
  'Apply performed before the final edit must not count'
);

const lessonContext = vm.createContext({ window: {} });
vm.runInContext(read('devices/ax3000gz_v2/lessons.js'), lessonContext);
const lessons = lessonContext.window.DEVICE_AX3000GZ_V2_LESSONS;
lessons.forEach(lesson => {
  lesson.grading.rules.forEach(rule => {
    assert.strictEqual(rule.requireInteraction, true, `${lesson.id}/${rule.id} must require current-attempt work`);
    assert.ok(rule.interactionSelector, `${lesson.id}/${rule.id} must define its interaction target`);
  });
});

const dhcp = lessons.find(lesson => lesson.id === 'LAB_AX3000GZ_V2_05');
assert.strictEqual(
  new Set(dhcp.grading.rules.filter(rule => rule.id.startsWith('lan_ip_')).map(rule => rule.interactionSelector)).size,
  1,
  'editing the logical LAN address must cover all four octets without forcing redundant edits'
);

[
  "input.setAttribute('autocomplete', 'new-password')",
  "input.setAttribute('data-lpignore', 'true')",
  "inputType === 'insertReplacementText'",
  "if (requiresVerifiedReset && resetSucceeded !== true)",
  "msg = 'Chưa thao tác trường này trong lượt làm hiện tại'",
  "msg = 'Chưa bấm Apply sau khi thay đổi trong lượt làm hiện tại'"
].forEach(marker => assert.ok(appJs.includes(marker), `app.js must retain: ${marker}`));

console.log('AX3000GZ V2 current-attempt isolation tests passed.');
