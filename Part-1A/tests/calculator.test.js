const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateSprint } = require('../src/calculator');

function sprint(overrides = {}) {
  return {
    sprintLengthDays: 10,
    team: [{ name: 'Asha' }],
    pastVelocities: [10],
    plannedPoints: 8,
    ...overrides,
  };
}

test('FR-002 accepts the sprint shape, uses oldest-first history, and applies member defaults', () => {
  const result = calculateSprint(sprint({
    team: [
      { name: 'Asha' },
      { name: 'Ben', leaveDays: 2, allocation: 0.5 },
    ],
    pastVelocities: [100, 3, 6, 9],
    plannedPoints: 5,
  }));

  assert.equal(result.fullCapacityDays, 15);
  assert.equal(result.availableCapacityDays, 14);
  assert.equal(result.averageVelocity, 6);
  assert.equal(result.forecastPoints, 5);
  assert.equal(result.plannedPoints, 5);
});

test('FR-003 sums full capacity and rounds an exact half-tenth up', () => {
  const result = calculateSprint(sprint({
    sprintLengthDays: 5,
    team: [{ name: 'Asha', allocation: 0.25 }],
  }));

  assert.equal(result.fullCapacityDays, 1.3);
});

test('FR-004 sums available capacity and rounds an exact half-tenth up', () => {
  const result = calculateSprint(sprint({
    sprintLengthDays: 5,
    team: [{ name: 'Asha', leaveDays: 2.5, allocation: 0.5 }],
  }));

  assert.equal(result.availableCapacityDays, 1.3);
});

test('FR-005 averages one and two values, selects the newest three, and rounds display to one decimal', () => {
  const oneValue = calculateSprint(sprint({ pastVelocities: [7] }));
  const twoValues = calculateSprint(sprint({ pastVelocities: [2, 3] }));
  const recentThree = calculateSprint(sprint({ pastVelocities: [99, 0, 0, 10] }));

  assert.equal(oneValue.averageVelocity, 7);
  assert.equal(twoValues.averageVelocity, 2.5);
  assert.equal(recentThree.averageVelocity, 3.3);
});

test('FR-006 floors forecast from the unrounded mean of selected history', () => {
  const result = calculateSprint(sprint({
    team: [{ name: 'Asha', leaveDays: 4 }],
    pastVelocities: [0, 0, 10],
    plannedPoints: 2,
  }));

  assert.equal(result.averageVelocity, 3.3);
  assert.equal(result.forecastPoints, 2);
});

test('FR-007 selects each verdict and difference at boundaries, including zero forecast', () => {
  const over = calculateSprint(sprint({ plannedPoints: 11 }));
  const lowerBoundary = calculateSprint(sprint({ plannedPoints: 8 }));
  const forecastEquality = calculateSprint(sprint({ plannedPoints: 10 }));
  const under = calculateSprint(sprint({ plannedPoints: 7 }));
  const zeroFits = calculateSprint(sprint({ pastVelocities: [0], plannedPoints: 0 }));
  const zeroOver = calculateSprint(sprint({ pastVelocities: [0], plannedPoints: 1 }));

  assert.deepEqual([over.verdict, over.differencePoints], ['OVER_COMMITTED', 1]);
  assert.deepEqual([lowerBoundary.verdict, lowerBoundary.differencePoints], ['FITS', 0]);
  assert.deepEqual([forecastEquality.verdict, forecastEquality.differencePoints], ['FITS', 0]);
  assert.deepEqual([under.verdict, under.differencePoints], ['UNDER_COMMITTED', 3]);
  assert.deepEqual([zeroFits.verdict, zeroFits.differencePoints], ['FITS', 0]);
  assert.deepEqual([zeroOver.verdict, zeroOver.differencePoints], ['OVER_COMMITTED', 1]);
});

test('FR-008 returns successful capacity with null history values when history is empty', () => {
  const result = calculateSprint(sprint({ pastVelocities: [] }));

  assert.equal(result.fullCapacityDays, 10);
  assert.equal(result.availableCapacityDays, 10);
  assert.equal(result.averageVelocity, null);
  assert.equal(result.forecastPoints, null);
  assert.equal(result.differencePoints, null);
  assert.equal(result.verdict, 'NO_HISTORY');
});
