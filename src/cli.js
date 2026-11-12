const fs = require('node:fs/promises');
const path = require('node:path');
const { analyze } = require('./analyze');
const { generateContent } = require('./ai-client');
const { readComments } = require('./input');

const DEFAULT_MODEL = 'gemini-3.8-flash';

function parseEnvFile(contents) {
  const values = new Map();
  for (const line of contents.split(/\r?\n/)) {
    let assignment = line.trim();
    if (!assignment || assignment.startsWith('#')) {
      continue;
    }
    if (assignment.startsWith('export ')) {
      assignment = assignment.slice(7).trimStart();
    }
    const separator = assignment.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key = assignment.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }
    let value = assignment.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    values.set(key, value);
  }
  return Object.fromEntries(values);
}

async function loadConfiguration(cwd, environment) {
  let fileValues = {};
  try {
    fileValues = parseEnvFile(await fs.readFile(path.join(cwd, '.env'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error('Unable to load local configuration');
    }
  }
  return { ...fileValues, ...environment };
}

function failure(exitCode, message) {
  return { exitCode, stdout: '', stderr: `${message}\n` };
}

// FR-001, FR-002, FR-005, FR-006, FR-009, FR-010, FR-011, FR-014.
async function runCli(argv, {
  cwd = process.cwd(),
  env = process.env,
  aiClient,
  fetchImpl,
  sleep,
  timeoutSignal
} = {}) {
  if (!Array.isArray(argv) || argv[0] !== 'analyze' || typeof argv[1] !== 'string' || argv.length !== 2) {
    return failure(1, 'Error: Usage: node src/cli.js analyze <file>');
  }

  let comments;
  try {
    comments = await readComments(path.resolve(cwd, argv[1]));
  } catch (error) {
    return failure(1, `Error: ${error.message}`);
  }

  let configuration;
  try {
    configuration = await loadConfiguration(cwd, env);
  } catch (error) {
    return failure(1, `Error: ${error.message}`);
  }

  if (comments.length > 0 && !configuration.GEMINI_API_KEY) {
    return failure(1, 'Error: GEMINI_API_KEY is required for nonempty input');
  }
  const model = configuration.GEMINI_MODEL || DEFAULT_MODEL;
  const client = aiClient || ((request) => generateContent({
    ...request,
    apiKey: configuration.GEMINI_API_KEY,
    fetchImpl,
    sleep,
    timeoutSignal
  }));

  try {
    const result = await analyze(comments, { aiClient: client, model });
    return { exitCode: 0, stdout: `${JSON.stringify(result)}\n`, stderr: '' };
  } catch (error) {
    if (error?.name === 'InvalidAiOutputError') {
      return failure(2, 'Error: AI service returned invalid output');
    }
    if (error?.name === 'AiServiceError') {
      return failure(2, 'Error: AI service unavailable');
    }
    return failure(1, `Error: ${error.message}`);
  }
}

async function main(argv) {
  const result = await runCli(argv);
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.exitCode;
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { runCli };
