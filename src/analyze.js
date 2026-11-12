const { buildPrompt, PROMPT_VERSION } = require('./prompt');
const { redactComments } = require('./redact');
const { validateResult } = require('./validate');

const DEFAULT_MODEL = 'gemini-3.8-flash';

function makeInvalidOutputError() {
  const error = new Error('AI service returned invalid output');
  error.name = 'InvalidAiOutputError';
  return error;
}

// FR-006, FR-007, FR-008, FR-009, FR-011, FR-014, SC-004.
async function analyze(inputComments, { aiClient, model = DEFAULT_MODEL } = {}) {
  const comments = redactComments(inputComments);
  const metadata = { model, temperature: 0.2, promptVersion: PROMPT_VERSION };
  if (comments.length === 0) {
    return {
      status: 'NEEDS_CLARIFICATION',
      comments,
      themes: [],
      sentiment: [],
      actionItems: [],
      clarification: 'Could you share feedback about your team or sprint?',
      meta: metadata
    };
  }

  if (typeof aiClient !== 'function') {
    throw new TypeError('An AI client is required for nonempty input');
  }

  const prompt = buildPrompt(comments);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      const modelOutput = await aiClient({ comments, model, prompt });
      response = { ...modelOutput, comments, meta: metadata };
      validateResult(response, { comments, model });
      return response;
    } catch (error) {
      if (error?.name === 'AiServiceError') {
        throw error;
      }
      if (attempt === 1) {
        throw makeInvalidOutputError();
      }
    }
  }
  throw makeInvalidOutputError();
}

module.exports = { analyze };
