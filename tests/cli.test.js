const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { runCli } = require('../src/cli');
const { createFakeAiClient } = require('./helpers/fakes');

test('FR-001 prints exactly one JSON result on the analyze success path', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-cli-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'comments.txt'), 'We planned well\n', 'utf8');
  const comments = [{ id: 1, text: 'We planned well' }];
  const fake = createFakeAiClient([{
    status: 'OK',
    comments,
    themes: [{ name: 'Planning', commentIds: [1] }],
    sentiment: [{ commentId: 1, label: 'positive' }],
    actionItems: [],
    clarification: null,
    meta: { model: 'gemini-3.8-flash', temperature: 0.2, promptVersion: 'v1' }
  }]);

  const output = await runCli(['analyze', 'comments.txt'], {
    cwd: directory,
    env: { GEMINI_API_KEY: 'test-key' },
    aiClient: fake.analyze
  });

  assert.equal(output.exitCode, 0);
  assert.equal(output.stderr, '');
  assert.equal(output.stdout.endsWith('\n'), true);
  assert.equal(output.stdout.trim().split('\n').length, 1);
  assert.equal(JSON.parse(output.stdout).status, 'OK');
});

test('FR-002 rejects missing files, excess comments, and overlong comments as invalid input', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-invalid-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'many.txt'), Array.from({ length: 51 }, () => 'Comment').join('\n'));
  await fs.writeFile(path.join(directory, 'long.txt'), 'x'.repeat(501));
  await fs.mkdir(path.join(directory, 'unreadable'));

  for (const file of ['missing.txt', 'many.txt', 'long.txt', 'unreadable']) {
    await t.test(`FR-002 rejects ${file}`, async () => {
      const output = await runCli(['analyze', file], { cwd: directory, env: {} });
      assert.equal(output.exitCode, 1);
      assert.equal(output.stdout, '');
      assert.match(output.stderr, /^Error:/);
    });
  }
});

test('FR-005 requires a key only for nonempty input', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-key-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'comments.txt'), 'Feedback');
  await fs.writeFile(path.join(directory, 'empty.txt'), '\n \n');
  const fake = createFakeAiClient([]);

  const nonempty = await runCli(['analyze', 'comments.txt'], { cwd: directory, env: {}, aiClient: fake.analyze });
  assert.equal(nonempty.exitCode, 1);
  assert.equal(nonempty.stdout, '');
  assert.match(nonempty.stderr, /^Error:/);

  const empty = await runCli(['analyze', 'empty.txt'], { cwd: directory, env: {}, aiClient: fake.analyze });
  assert.equal(empty.exitCode, 0);
  assert.equal(JSON.parse(empty.stdout).status, 'NEEDS_CLARIFICATION');
  assert.equal(fake.calls.length, 0);
});

test('FR-009 and FR-010 report exhausted AI failures with exit code 2 and no stdout', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-failure-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'comments.txt'), 'Feedback');
  const env = { GEMINI_API_KEY: 'test-key' };

  const serviceFailure = createFakeAiClient([
    Object.assign(new Error('offline'), { name: 'AiServiceError' }),
    Object.assign(new Error('offline'), { name: 'AiServiceError' })
  ]);
  const serviceOutput = await runCli(['analyze', 'comments.txt'], {
    cwd: directory,
    env,
    aiClient: serviceFailure.analyze
  });
  assert.equal(serviceOutput.exitCode, 2);
  assert.equal(serviceOutput.stdout, '');
  assert.match(serviceOutput.stderr, /^Error: AI service unavailable/);

  const invalidOutput = createFakeAiClient([null, null]);
  const invalidResult = await runCli(['analyze', 'comments.txt'], {
    cwd: directory,
    env,
    aiClient: invalidOutput.analyze
  });
  assert.equal(invalidResult.exitCode, 2);
  assert.equal(invalidResult.stdout, '');
  assert.equal(invalidResult.stderr, 'Error: AI service returned invalid output\n');
});

test('FR-005 loads .env without overriding process configuration and keeps the key private', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-env-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'comments.txt'), 'Feedback');
  await fs.writeFile(path.join(directory, '.env'), 'GEMINI_API_KEY=dotenv-test-key\nGEMINI_MODEL=dotenv-model\n');
  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    const model = url.includes('/process-model:') ? 'process-model' : 'dotenv-model';
    const result = {
      status: 'OK',
      comments: [{ id: 1, text: 'Feedback' }],
      themes: [{ name: 'Feedback', commentIds: [1] }],
      sentiment: [{ commentId: 1, label: 'neutral' }],
      actionItems: [],
      clarification: null,
      meta: { model, temperature: 0.2, promptVersion: 'v1' }
    };
    return {
      ok: true,
      status: 200,
      async json() {
        return { candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] };
      }
    };
  };

  const dotenvOutput = await runCli(['analyze', 'comments.txt'], {
    cwd: directory,
    env: {},
    fetchImpl
  });
  assert.equal(dotenvOutput.exitCode, 0);
  assert.equal(JSON.parse(dotenvOutput.stdout).meta.model, 'dotenv-model');
  assert.equal(fetchCalls[0].options.headers['x-goog-api-key'], 'dotenv-test-key');

  const processOutput = await runCli(['analyze', 'comments.txt'], {
    cwd: directory,
    env: { GEMINI_API_KEY: 'process-test-key', GEMINI_MODEL: 'process-model' },
    fetchImpl
  });

  assert.equal(processOutput.exitCode, 0);
  assert.equal(JSON.parse(processOutput.stdout).meta.model, 'process-model');
  assert.equal(fetchCalls[1].options.headers['x-goog-api-key'], 'process-test-key');
  assert.doesNotMatch(dotenvOutput.stdout + dotenvOutput.stderr + processOutput.stdout + processOutput.stderr, /process-test-key|dotenv-test-key/);
});
