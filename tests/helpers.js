const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

// FR-001, FR-016, FR-017, NFR-004
function withTempInput(contents, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sprint-calculator-'));
  const inputPath = path.join(directory, 'input.json');
  const fileContents = typeof contents === 'string'
    ? contents
    : JSON.stringify(contents);

  try {
    fs.writeFileSync(inputPath, fileContents, 'utf8');
    return callback(inputPath);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

// FR-001, FR-016, FR-017, NFR-004
function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    timeout: 5000,
  });
}

module.exports = {
  runCli,
  withTempInput,
};
