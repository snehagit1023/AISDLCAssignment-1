const { responseSchema } = require('./prompt');

const RETRY_DELAY_MS = 2_000;
const MAX_ATTEMPTS = 2;

function makeError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

async function defaultSleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

// FR-005, FR-010, FR-011, FR-014.
async function generateContent({
  apiKey,
  model,
  prompt,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
  timeoutSignal = (milliseconds) => AbortSignal.timeout(milliseconds)
}) {
  let lastServiceError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema
            }
          }),
          signal: timeoutSignal(30_000)
        }
      );
    } catch {
      lastServiceError = makeError('AiServiceError', 'AI service unavailable');
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw lastServiceError;
    }

    if (!response.ok) {
      if (isRetryableStatus(response.status)) {
        lastServiceError = makeError('AiServiceError', 'AI service unavailable');
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw lastServiceError;
      }
      throw makeError('AiServiceError', 'AI service request failed');
    }

    let providerBody;
    try {
      providerBody = await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw makeError('InvalidAiOutputError', 'AI service returned invalid output');
      }
      lastServiceError = makeError('AiServiceError', 'AI service unavailable');
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw lastServiceError;
    }
    const text = providerBody?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw makeError('InvalidAiOutputError', 'AI service returned invalid output');
    }
    try {
      return JSON.parse(text);
    } catch {
      throw makeError('InvalidAiOutputError', 'AI service returned invalid output');
    }
  }

  throw lastServiceError || makeError('AiServiceError', 'AI service unavailable');
}

module.exports = { generateContent };
