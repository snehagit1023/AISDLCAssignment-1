const fs = require('node:fs');
const { calculateSprint, ValidationError } = require('./calculator');

// FR-001
function parseArguments(args) {
  if (
    args.length !== 2
    && !(args.length === 3 && args[2] === '--json')
  ) {
    throw new ValidationError('Error: invalid arguments; expected report <file> [--json]');
  }

  if (args[0] !== 'report' || args[1].length === 0) {
    throw new ValidationError('Error: invalid arguments; expected report <file> [--json]');
  }

  return {
    filePath: args[1],
    json: args.length === 3,
  };
}

function renderVerdict(report) {
  if (report.verdict === 'OVER_COMMITTED' || report.verdict === 'UNDER_COMMITTED') {
    return `${report.verdict} by ${report.differencePoints} points`;
  }

  return report.verdict;
}

// FR-009
function renderReadable(report) {
  return [
    `Full capacity: ${report.fullCapacityDays.toFixed(1)} person-days`,
    `Available capacity: ${report.availableCapacityDays.toFixed(1)} person-days`,
    `Average velocity: ${report.averageVelocity === null ? 'N/A' : report.averageVelocity.toFixed(1)} points`,
    `Forecast: ${report.forecastPoints === null ? 'N/A' : report.forecastPoints} points`,
    `Planned points: ${report.plannedPoints}`,
    `Verdict: ${renderVerdict(report)}`,
  ].join('\n');
}

// FR-010, FR-018
function renderJson(report) {
  return JSON.stringify({
    fullCapacityDays: report.fullCapacityDays,
    availableCapacityDays: report.availableCapacityDays,
    averageVelocity: report.averageVelocity,
    forecastPoints: report.forecastPoints,
    plannedPoints: report.plannedPoints,
    verdict: report.verdict,
    differencePoints: report.differencePoints,
  });
}

function reportError(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

// FR-017
function main(args) {
  let command;

  try {
    command = parseArguments(args);
  } catch (error) {
    if (error instanceof ValidationError) {
      reportError(error.message);
      return;
    }

    throw error;
  }

  let fileContents;

  // FR-016
  try {
    fileContents = fs.readFileSync(command.filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      reportError(`Error: file not found: ${command.filePath}`);
    } else {
      reportError(`Error: unable to read file: ${command.filePath}`);
    }
    return;
  }

  let input;
  try {
    input = JSON.parse(fileContents);
  } catch (error) {
    if (error instanceof SyntaxError) {
      reportError(`Error: invalid JSON in ${command.filePath}`);
      return;
    }

    throw error;
  }

  let report;
  try {
    report = calculateSprint(input);
  } catch (error) {
    if (error instanceof ValidationError) {
      reportError(error.message);
      return;
    }

    throw error;
  }

  // FR-018
  process.stdout.write(`${command.json ? renderJson(report) : renderReadable(report)}\n`);
}

main(process.argv.slice(2));
