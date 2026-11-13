function greatestCommonDivisor(left, right) {
  let first = left < 0n ? -left : left;
  let second = right < 0n ? -right : right;

  while (second !== 0n) {
    const remainder = first % second;
    first = second;
    second = remainder;
  }

  return first;
}

function fraction(numerator, denominator = 1n) {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function decimalFraction(value) {
  const text = String(value);
  const exponentIndex = Math.max(text.indexOf('e'), text.indexOf('E'));
  const coefficient = exponentIndex === -1 ? text : text.slice(0, exponentIndex);
  const exponent = exponentIndex === -1 ? 0 : Number(text.slice(exponentIndex + 1));
  const isNegative = coefficient.startsWith('-');
  const unsignedCoefficient = isNegative ? coefficient.slice(1) : coefficient;
  const decimalIndex = unsignedCoefficient.indexOf('.');
  const integerDigits = decimalIndex === -1
    ? unsignedCoefficient
    : unsignedCoefficient.slice(0, decimalIndex);
  const fractionalDigits = decimalIndex === -1
    ? ''
    : unsignedCoefficient.slice(decimalIndex + 1);
  let numerator = BigInt(`${integerDigits}${fractionalDigits}`);
  const scale = fractionalDigits.length - exponent;

  if (scale > 0) {
    return fraction(
      isNegative ? -numerator : numerator,
      10n ** BigInt(scale),
    );
  }

  if (scale < 0) {
    numerator *= 10n ** BigInt(-scale);
  }

  return fraction(isNegative ? -numerator : numerator);
}

function addFractions(left, right) {
  return fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractFractions(left, right) {
  return fraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyFractions(left, right) {
  return fraction(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

function divideFractions(left, right) {
  return fraction(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
}

function roundHalfUpOneDecimal(value) {
  const scaledNumerator = value.numerator * 10n;
  const tenths = (scaledNumerator * 2n + value.denominator) / (2n * value.denominator);
  return Number(tenths) / 10;
}

function floorFraction(value) {
  return Number(value.numerator / value.denominator);
}

// FR-002
function normalizeSprint(input) {
  return {
    sprintLengthDays: input.sprintLengthDays,
    team: input.team.map((member) => ({
      name: member.name,
      leaveDays: member.leaveDays === undefined ? 0 : member.leaveDays,
      allocation: member.allocation === undefined ? 1 : member.allocation,
    })),
    pastVelocities: [...input.pastVelocities],
    plannedPoints: input.plannedPoints,
  };
}

// FR-011, FR-012, FR-013, FR-014, FR-015
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// FR-011
function validateSprintLength(input) {
  const value = input.sprintLengthDays;

  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1 || value > 30) {
    throw new ValidationError('Error: sprintLengthDays must be a whole number from 1 to 30');
  }
}

// FR-013
function validateLeaveDays(member, index, sprintLengthDays) {
  const leaveDays = member.leaveDays === undefined ? 0 : member.leaveDays;

  if (
    typeof leaveDays !== 'number'
    || !Number.isFinite(leaveDays)
    || leaveDays < 0
    || leaveDays > sprintLengthDays
  ) {
    throw new ValidationError(
      `Error: team[${index}].leaveDays must be a finite number from 0 to sprintLengthDays`,
    );
  }
}

// FR-014
function validateAllocation(member, index) {
  const allocation = member.allocation === undefined ? 1 : member.allocation;

  if (
    typeof allocation !== 'number'
    || !Number.isFinite(allocation)
    || allocation < 0.1
    || allocation > 1
  ) {
    throw new ValidationError(
      `Error: team[${index}].allocation must be a finite number from 0.1 to 1.0`,
    );
  }
}

// FR-012
function validateTeam(team, sprintLengthDays) {
  if (!Array.isArray(team) || team.length === 0) {
    throw new ValidationError('Error: team must be a non-empty array');
  }

  const normalizedNames = new Set();
  team.forEach((member, index) => {
    if (!member || typeof member !== 'object' || Array.isArray(member)) {
      throw new ValidationError(`Error: team[${index}] must be an object`);
    }

    if (typeof member.name !== 'string' || member.name.trim().length === 0) {
      throw new ValidationError(`Error: team[${index}].name must be a non-empty string`);
    }

    const normalizedName = member.name.trim().toLowerCase();
    if (normalizedNames.has(normalizedName)) {
      throw new ValidationError(`Error: team[${index}].name must be unique`);
    }
    normalizedNames.add(normalizedName);

    validateLeaveDays(member, index, sprintLengthDays);
    validateAllocation(member, index);
  });
}

// FR-015
function validateInputShape(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Error: input must be an object');
  }

  for (const field of ['sprintLengthDays', 'team', 'pastVelocities', 'plannedPoints']) {
    if (!Object.hasOwn(input, field)) {
      throw new ValidationError(`Error: missing required field ${field}`);
    }
  }
}

// FR-015
function validateVelocities(pastVelocities) {
  if (!Array.isArray(pastVelocities)) {
    throw new ValidationError('Error: pastVelocities must be an array');
  }

  pastVelocities.forEach((velocity, index) => {
    if (
      typeof velocity !== 'number'
      || !Number.isFinite(velocity)
      || !Number.isInteger(velocity)
      || velocity < 0
    ) {
      throw new ValidationError(
        `Error: pastVelocities[${index}] must be a non-negative whole number`,
      );
    }
  });
}

// FR-015
function validatePlannedPoints(plannedPoints) {
  if (
    typeof plannedPoints !== 'number'
    || !Number.isFinite(plannedPoints)
    || !Number.isInteger(plannedPoints)
    || plannedPoints < 0
  ) {
    throw new ValidationError('Error: plannedPoints must be a non-negative whole number');
  }
}

function validateInput(input) {
  validateInputShape(input);
  validateSprintLength(input);
  validateTeam(input.team, input.sprintLengthDays);
  validateVelocities(input.pastVelocities);
  validatePlannedPoints(input.plannedPoints);
}

function calculateVerdict(forecastPoints, plannedPoints) {
  if (forecastPoints === 0) {
    return plannedPoints === 0
      ? { verdict: 'FITS', differencePoints: 0 }
      : { verdict: 'OVER_COMMITTED', differencePoints: plannedPoints };
  }

  if (plannedPoints > forecastPoints) {
    return {
      verdict: 'OVER_COMMITTED',
      differencePoints: plannedPoints - forecastPoints,
    };
  }

  // FR-007
  if (BigInt(plannedPoints) * 5n >= BigInt(forecastPoints) * 4n) {
    return { verdict: 'FITS', differencePoints: 0 };
  }

  return {
    verdict: 'UNDER_COMMITTED',
    differencePoints: forecastPoints - plannedPoints,
  };
}

// FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-011, FR-012, FR-013, FR-014, FR-015, FR-018
// FR-018
function calculateSprint(input) {
  validateInput(input);
  const normalized = normalizeSprint(input);
  const sprintLength = decimalFraction(normalized.sprintLengthDays);

  // FR-003
  const fullCapacity = normalized.team.reduce((total, member) => addFractions(
    total,
    multiplyFractions(sprintLength, decimalFraction(member.allocation)),
  ), fraction(0n));
  const fullCapacityDays = roundHalfUpOneDecimal(fullCapacity);

  // FR-004
  const availableCapacity = normalized.team.reduce((total, member) => {
    const availableDays = subtractFractions(
      sprintLength,
      decimalFraction(member.leaveDays),
    );

    return addFractions(
      total,
      multiplyFractions(availableDays, decimalFraction(member.allocation)),
    );
  }, fraction(0n));
  const availableCapacityDays = roundHalfUpOneDecimal(availableCapacity);

  // FR-008
  if (normalized.pastVelocities.length === 0) {
    return {
      fullCapacityDays,
      availableCapacityDays,
      averageVelocity: null,
      forecastPoints: null,
      plannedPoints: normalized.plannedPoints,
      verdict: 'NO_HISTORY',
      differencePoints: null,
    };
  }

  // FR-005
  const recentVelocities = normalized.pastVelocities.slice(-3);
  const velocityTotal = recentVelocities.reduce(
    (total, velocity) => addFractions(total, decimalFraction(velocity)),
    fraction(0n),
  );
  const average = divideFractions(
    velocityTotal,
    fraction(BigInt(recentVelocities.length)),
  );
  const averageVelocity = roundHalfUpOneDecimal(average);

  // FR-006
  const forecast = multiplyFractions(
    average,
    divideFractions(availableCapacity, fullCapacity),
  );
  const forecastPoints = floorFraction(forecast);

  // FR-007
  const { verdict, differencePoints } = calculateVerdict(
    forecastPoints,
    normalized.plannedPoints,
  );

  return {
    fullCapacityDays,
    availableCapacityDays,
    averageVelocity,
    forecastPoints,
    plannedPoints: normalized.plannedPoints,
    verdict,
    differencePoints,
  };
}

// FR-011, FR-012, FR-013, FR-014, FR-015
module.exports = {
  calculateSprint,
  ValidationError,
};
