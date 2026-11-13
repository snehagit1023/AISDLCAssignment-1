const test = require('node:test');
const assert = require('node:assert/strict');
const { generateContent } = require('../src/ai-client');
const { createSleepRecorder } = require('./helpers/fakes');

function providerResponse(text) {
  return {
    ok: true,
    status: 200,
    async json() {
      return { candidates: [{ content: { parts: [{ text }] } }] };
    }
  };
}

test('FR-005 places the key only in the header and requests JSON schema output', async () => {
  let captured;
  const result = { status: 'OK' };

  await generateContent({
    apiKey: 'fake-test-key',
    model: 'model-test',
    prompt: 'prompt',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return providerResponse(JSON.stringify(result));
    },
    timeoutSignal: (milliseconds) => {
      assert.equal(milliseconds, 30_000);
      return new AbortController().signal;
    },
    sleep: async () => {}
  });

  assert.equal(captured.url, 'https://generativelanguage.googleapis.com/v1beta/models/model-test:generateContent');
  assert.equal(captured.options.headers['x-goog-api-key'], 'fake-test-key');
  assert.equal(captured.url.includes('fake-test-key'), false);
  const body = JSON.parse(captured.options.body);
  assert.equal(body.generationConfig.temperature, 0.2);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.ok(body.generationConfig.responseSchema);
});

test('FR-010 retries timeout, quota, server, and network failures once after two seconds', async (t) => {
  const failures = [
    () => Object.assign(new Error('timeout'), { name: 'AbortError' }),
    () => ({ status: 429 }),
    () => ({ status: 503 }),
    () => new TypeError('network failure')
  ];

  for (const createFailure of failures) {
    await t.test(`FR-010 retries ${createFailure().name || createFailure().status || 'network'} once`, async () => {
      let attempts = 0;
      const recorder = createSleepRecorder();
      const result = await generateContent({
        apiKey: 'fake-test-key',
        model: 'model-test',
        prompt: 'prompt',
        fetchImpl: async () => {
          attempts += 1;
          if (attempts === 1) {
            const failure = createFailure();
            if (failure instanceof Error) {
              throw failure;
            }
            return { ok: false, status: failure.status };
          }
          return providerResponse('{"ok":true}');
        },
        timeoutSignal: () => new AbortController().signal,
        sleep: recorder.sleep
      });

      assert.deepEqual(result, { ok: true });
      assert.equal(attempts, 2);
      assert.deepEqual(recorder.delays, [2_000]);
    });
  }
});

test('FR-010 stops after two transient failures', async () => {
  let attempts = 0;
  const recorder = createSleepRecorder();

  await assert.rejects(
    generateContent({
      apiKey: 'fake-test-key',
      model: 'model-test',
      prompt: 'prompt',
      fetchImpl: async () => {
        attempts += 1;
        return { ok: false, status: 503 };
      },
      timeoutSignal: () => new AbortController().signal,
      sleep: recorder.sleep
    }),
    { name: 'AiServiceError' }
  );
  assert.equal(attempts, 2);
  assert.deepEqual(recorder.delays, [2_000]);
});

test('FR-010 retries a timeout while reading the provider response body', async () => {
  let attempts = 0;
  const recorder = createSleepRecorder();
  const result = await generateContent({
    apiKey: 'fake-test-key',
    model: 'model-test',
    prompt: 'prompt',
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) {
        return {
          ok: true,
          async json() {
            throw Object.assign(new Error('timeout'), { name: 'AbortError' });
          }
        };
      }
      return providerResponse('{"ok":true}');
    },
    timeoutSignal: () => new AbortController().signal,
    sleep: recorder.sleep
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(attempts, 2);
  assert.deepEqual(recorder.delays, [2_000]);
});

test('FR-009 classifies malformed provider JSON as invalid model output', async () => {
  await assert.rejects(
    generateContent({
      apiKey: 'fake-test-key',
      model: 'model-test',
      prompt: 'prompt',
      fetchImpl: async () => providerResponse('{invalid'),
      timeoutSignal: () => new AbortController().signal,
      sleep: async () => {}
    }),
    { name: 'InvalidAiOutputError' }
  );
});
