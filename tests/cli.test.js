const assert = require('node:assert/strict');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const test = require('node:test');

const { runCli, withTempInput } = require('./helpers');
const projectRoot = path.join(__dirname, '..');

function validInput(overrides = {}) {
  return {
    sprintLengthDays: 10,
    team: [{ name: 'Asha' }],
    pastVelocities: [10],
    plannedPoints: 8,
    ...overrides,
  };
}

function assertInvalidInput(input, field) {
  withTempInput(input, (inputPath) => {
    const result = runCli(['report', inputPath]);

    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Error:/);
    assert.ok(result.stderr.includes(field), `Expected stderr to name ${field}`);
    assert.doesNotMatch(result.stderr, /\n\s+at\s|\bValidationError\b/);
  });
}

test('FR-001 accepts readable and JSON report command forms', () => {
  const inputPath = path.join(projectRoot, 'examples', 'worked-example.json');
  const readable = runCli(['report', inputPath]);
  const json = runCli(['report', inputPath, '--json']);

  assert.equal(readable.status, 0);
  assert.match(readable.stdout, /^Full capacity: 35\.0 person-days/m);
  assert.equal(readable.stderr, '');
  assert.equal(json.status, 0);
  assert.notEqual(json.stdout, '');
  assert.equal(json.stderr, '');
});

test('FR-008 reports no history with capacities, N/A text, and null JSON values', () => {
  const inputPath = path.join(projectRoot, 'examples', 'no-history.json');
  const readable = runCli(['report', inputPath]);
  const json = runCli(['report', inputPath, '--json']);
  const report = JSON.parse(json.stdout);

  assert.equal(readable.status, 0);
  assert.match(readable.stdout, /Full capacity: 20\.0 person-days/);
  assert.match(readable.stdout, /Available capacity: 18\.0 person-days/);
  assert.match(readable.stdout, /Average velocity: N\/A points/);
  assert.match(readable.stdout, /Forecast: N\/A points/);
  assert.match(readable.stdout, /Verdict: NO_HISTORY\n$/);
  assert.equal(json.status, 0);
  assert.equal(report.averageVelocity, null);
  assert.equal(report.forecastPoints, null);
  assert.equal(report.differencePoints, null);
});

test('FR-009 renders exactly six lines with fixed labels, order, precision, and verdict wording', () => {
  const inputPath = path.join(projectRoot, 'examples', 'worked-example.json');
  const result = runCli(['report', inputPath]);

  assert.equal(result.status, 0);
  assert.deepEqual(result.stdout.trimEnd().split('\n'), [
    'Full capacity: 35.0 person-days',
    'Available capacity: 33.0 person-days',
    'Average velocity: 24.0 points',
    'Forecast: 22 points',
    'Planned points: 25',
    'Verdict: OVER_COMMITTED by 3 points',
  ]);
});

test('NFR-003 completes a 50-member report in under 1000 ms after fixture creation', () => {
  const input = {
    sprintLengthDays: 10,
    team: Array.from({ length: 50 }, (_, index) => ({ name: `Member ${index + 1}` })),
    pastVelocities: [18, 22, 26, 24],
    plannedPoints: 250,
  };

  withTempInput(input, (inputPath) => {
    const startedAt = performance.now();
    const result = runCli(['report', inputPath]);
    const elapsedMs = performance.now() - startedAt;

    assert.equal(result.status, 0, result.stderr);
    assert.ok(elapsedMs < 1000, `50-member CLI run took ${elapsedMs.toFixed(1)} ms`);
  });
});

test('FR-010 emits the seven JSON fields in contract order with specified values and nulls', () => {
  const workedInput = path.join(projectRoot, 'examples', 'worked-example.json');
  const emptyHistoryInput = path.join(projectRoot, 'examples', 'no-history.json');
  const workedResult = runCli(['report', workedInput, '--json']);
  const emptyHistoryResult = runCli(['report', emptyHistoryInput, '--json']);
  const workedReport = JSON.parse(workedResult.stdout);
  const emptyHistoryReport = JSON.parse(emptyHistoryResult.stdout);

  assert.equal(workedResult.status, 0);
  assert.deepEqual(Object.keys(workedReport), [
    'fullCapacityDays',
    'availableCapacityDays',
    'averageVelocity',
    'forecastPoints',
    'plannedPoints',
    'verdict',
    'differencePoints',
  ]);
  assert.deepEqual(workedReport, {
    fullCapacityDays: 35,
    availableCapacityDays: 33,
    averageVelocity: 24,
    forecastPoints: 22,
    plannedPoints: 25,
    verdict: 'OVER_COMMITTED',
    differencePoints: 3,
  });
  assert.equal(emptyHistoryResult.status, 0);
  assert.equal(emptyHistoryReport.averageVelocity, null);
  assert.equal(emptyHistoryReport.forecastPoints, null);
  assert.equal(emptyHistoryReport.differencePoints, null);
});

test('FR-018 repeats byte-for-byte identical output for identical input and mode', () => {
  const input = {
    sprintLengthDays: 10,
    team: [{ name: 'Asha', leaveDays: 2 }],
    pastVelocities: [18, 22, 26, 24],
    plannedPoints: 15,
  };

  withTempInput(input, (inputPath) => {
    const firstReadable = runCli(['report', inputPath]);
    const secondReadable = runCli(['report', inputPath]);
    const firstJson = runCli(['report', inputPath, '--json']);
    const secondJson = runCli(['report', inputPath, '--json']);

    assert.equal(firstReadable.status, 0);
    assert.equal(secondReadable.status, 0);
    assert.equal(firstJson.status, 0);
    assert.equal(secondJson.status, 0);
    assert.equal(firstReadable.stdout, secondReadable.stdout);
    assert.equal(firstJson.stdout, secondJson.stdout);
  });
});

test('FR-011 rejects out-of-range, fractional, missing, and wrongly typed sprint lengths', () => {
  assertInvalidInput(validInput({ sprintLengthDays: 0 }), 'sprintLengthDays');
  assertInvalidInput(validInput({ sprintLengthDays: 31 }), 'sprintLengthDays');
  assertInvalidInput(validInput({ sprintLengthDays: 1.5 }), 'sprintLengthDays');
  const missingLength = validInput();
  delete missingLength.sprintLengthDays;
  assertInvalidInput(missingLength, 'sprintLengthDays');
  assertInvalidInput(validInput({ sprintLengthDays: '10' }), 'sprintLengthDays');

  for (const boundary of [1, 30]) {
    withTempInput(validInput({ sprintLengthDays: boundary }), (inputPath) => {
      assert.equal(runCli(['report', inputPath]).status, 0);
    });
  }
});

test('FR-012 rejects empty teams, invalid names, and trimmed case-insensitive duplicates', () => {
  assertInvalidInput(validInput({ team: [] }), 'team');
  assertInvalidInput(validInput({ team: [{}] }), 'team[0].name');
  assertInvalidInput(validInput({ team: [{ name: '  ' }] }), 'team[0].name');
  assertInvalidInput(validInput({
    team: [{ name: ' Asha ' }, { name: 'asha' }],
  }), 'team[1].name');
});

test('FR-013 rejects invalid leave and accepts inclusive boundaries, fractions, and defaults', () => {
  assertInvalidInput(validInput({
    team: [{ name: 'Asha', leaveDays: -0.1 }],
  }), 'team[0].leaveDays');
  assertInvalidInput(validInput({
    team: [{ name: 'Asha', leaveDays: 10.1 }],
  }), 'team[0].leaveDays');
  assertInvalidInput(validInput({
    team: [{ name: 'Asha', leaveDays: '2' }],
  }), 'team[0].leaveDays');

  for (const leaveDays of [0, 10, 2.5]) {
    withTempInput(validInput({
      team: [{ name: 'Asha', leaveDays }],
    }), (inputPath) => {
      assert.equal(runCli(['report', inputPath]).status, 0);
    });
  }
  withTempInput(validInput({ team: [{ name: 'Asha' }] }), (inputPath) => {
    assert.equal(runCli(['report', inputPath]).status, 0);
  });
});

test('FR-014 rejects invalid allocations and accepts inclusive boundaries and defaults', () => {
  for (const allocation of [0, 1.1, '0.5']) {
    assertInvalidInput(validInput({
      team: [{ name: 'Asha', allocation }],
    }), 'team[0].allocation');
  }

  for (const allocation of [0.1, 1]) {
    withTempInput(validInput({
      team: [{ name: 'Asha', allocation }],
    }), (inputPath) => {
      assert.equal(runCli(['report', inputPath]).status, 0);
    });
  }
  withTempInput(validInput({ team: [{ name: 'Asha' }] }), (inputPath) => {
    assert.equal(runCli(['report', inputPath]).status, 0);
  });
});

test('FR-015 rejects invalid totals, missing fields, wrong types, and malformed input shapes', () => {
  assertInvalidInput(validInput({ pastVelocities: [-1] }), 'pastVelocities[0]');
  assertInvalidInput(validInput({ pastVelocities: [1.5] }), 'pastVelocities[0]');
  assertInvalidInput(validInput({ pastVelocities: ['10'] }), 'pastVelocities[0]');
  assertInvalidInput(validInput({ plannedPoints: -1 }), 'plannedPoints');
  assertInvalidInput(validInput({ plannedPoints: 1.5 }), 'plannedPoints');
  const missingPlanned = validInput();
  delete missingPlanned.plannedPoints;
  assertInvalidInput(missingPlanned, 'plannedPoints');
  assertInvalidInput(validInput({ plannedPoints: '8' }), 'plannedPoints');
  assertInvalidInput(null, 'input');
  assertInvalidInput(validInput({ team: {} }), 'team');
  assertInvalidInput(validInput({ team: [null] }), 'team[0]');
  assertInvalidInput(validInput({ pastVelocities: {} }), 'pastVelocities');
});

test('FR-016 rejects missing files and malformed JSON with the exact contract messages', () => {
  const missingPath = path.join(projectRoot, 'examples', 'does-not-exist.json');
  const missing = runCli(['report', missingPath]);
  const malformedPath = path.join(projectRoot, 'examples', 'invalid-json.json');
  const malformed = runCli(['report', malformedPath]);

  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, '');
  assert.equal(missing.stderr, `Error: file not found: ${missingPath}\n`);
  assert.equal(malformed.status, 1);
  assert.equal(malformed.stdout, '');
  assert.equal(malformed.stderr, `Error: invalid JSON in ${malformedPath}\n`);
});

test('FR-017 rejects invalid arguments, unreadable paths, and invalid data without stack traces', () => {
  for (const args of [[], ['unknown', 'input.json'], ['report'], ['report', 'file.json', '--other']]) {
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Error:.*arguments/);
    assert.doesNotMatch(result.stderr, /\n\s+at\s/);
  }

  const unreadablePath = path.join(projectRoot, 'examples');
  const unreadable = runCli(['report', unreadablePath]);
  assert.equal(unreadable.status, 1);
  assert.equal(unreadable.stdout, '');
  assert.match(unreadable.stderr, /^Error:.*file/);
  assert.ok(unreadable.stderr.includes(unreadablePath));
  assert.doesNotMatch(unreadable.stderr, /\n\s+at\s/);
  assertInvalidInput(validInput({ plannedPoints: -1 }), 'plannedPoints');
});
