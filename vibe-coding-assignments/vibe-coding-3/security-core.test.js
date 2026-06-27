const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PRESET_PAYLOADS,
  runInsecureFlow,
  runSecureFlow
} = require('./security-core');

test('insecure_normal_input_returns_expected_single_user', () => {
  const result = runInsecureFlow(PRESET_PAYLOADS.normal);
  assert.equal(result.injectionSucceeded, false);
  assert.equal(result.returnedRows.length, 1);
  assert.equal(result.returnedRows[0].username, 'olivia');
});

test('insecure_tautology_bypasses_filter', () => {
  const result = runInsecureFlow(PRESET_PAYLOADS.tautology);
  assert.equal(result.injectionSucceeded, true);
  assert.match(result.impact, /bypass/i);
  assert.equal(result.returnedRows.length >= 3, true);
});

test('secure_tautology_rejected', () => {
  const result = runSecureFlow(PRESET_PAYLOADS.tautology);
  assert.equal(result.blocked, true);
  assert.equal(result.returnedRows.length, 0);
  assert.match(result.statusLabel, /Blocked/);
});

test('insecure_union_expands_result_set', () => {
  const result = runInsecureFlow(PRESET_PAYLOADS.union);
  assert.equal(result.injectionSucceeded, true);
  assert.equal(result.returnedRows.some((row) => row.username === 'exposed_admin_hash'), true);
});

test('secure_union_rejected', () => {
  const result = runSecureFlow(PRESET_PAYLOADS.union);
  assert.equal(result.blocked, true);
  assert.equal(result.returnedRows.length, 0);
});

test('insecure_comment_termination_changes_behavior', () => {
  const result = runInsecureFlow(PRESET_PAYLOADS.comment);
  assert.equal(result.injectionSucceeded, true);
  assert.match(result.impact, /Comment termination/);
  assert.equal(result.returnedRows.length, 1);
  assert.equal(result.returnedRows[0].username, 'olivia');
});

test('secure_comment_termination_rejected', () => {
  const result = runSecureFlow(PRESET_PAYLOADS.comment);
  assert.equal(result.blocked, true);
  assert.equal(result.returnedRows.length, 0);
});

test('secure_normal_input_executes_safely', () => {
  const result = runSecureFlow(PRESET_PAYLOADS.normal);
  assert.equal(result.blocked, false);
  assert.equal(result.returnedRows.length, 1);
  assert.equal(result.returnedRows[0].username, 'olivia');
});
