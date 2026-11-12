const test = require('node:test');
const assert = require('node:assert/strict');
const { redactText } = require('../src/redact');
const { analyze } = require('../src/analyze');
const { createFakeAiClient } = require('./helpers/fakes');

test('FR-003 redacts email addresses and supported 7–15 digit phone formats', () => {
  const text = 'Email alice@example.com; call +1 (212) 555-0199 or (020) 7946-0958.';

  assert.equal(redactText(text), 'Email [EMAIL]; call [PHONE] or [PHONE].');
});

test('FR-003 sends and returns only redacted canonical comments', async () => {
  const comments = [{ id: 1, text: 'Contact alice@example.com at +1 (212) 555-0199' }];
  const redacted = [{ id: 1, text: 'Contact [EMAIL] at [PHONE]' }];
  const fake = createFakeAiClient([{
    status: 'OK',
    comments: redacted,
    themes: [{ name: 'Contact details', commentIds: [1] }],
    sentiment: [{ commentId: 1, label: 'neutral' }],
    actionItems: [],
    clarification: null,
    meta: { model: 'gemini-3.8-flash', temperature: 0.2, promptVersion: 'v2' }
  }]);

  const result = await analyze(comments, { aiClient: fake.analyze });

  assert.deepEqual(fake.calls[0].comments, redacted);
  assert.deepEqual(result.comments, redacted);
  assert.doesNotMatch(JSON.stringify(result), /alice@example\.com|212/);
});
