const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze } = require('../src/analyze');
const { createFakeAiClient } = require('./helpers/fakes');

test('FR-006 SC-004 analyzes 50 comments of 500 Unicode code points with valid references', async () => {
  const comments = Array.from({ length: 50 }, (_, index) => ({
    id: index + 1,
    text: '😀'.repeat(500)
  }));
  const response = {
    status: 'OK',
    comments: structuredClone(comments),
    themes: [{ name: 'Team feedback', commentIds: comments.map((comment) => comment.id) }],
    sentiment: comments.map((comment) => ({ commentId: comment.id, label: 'neutral' })),
    actionItems: [],
    clarification: null,
    meta: { model: 'gemini-3.8-flash', temperature: 0.2, promptVersion: 'v2' }
  };
  const fake = createFakeAiClient([response]);

  const result = await analyze(comments, { aiClient: fake.analyze });

  assert.equal(fake.calls.length, 1);
  assert.equal(result.comments.length, 50);
  assert.ok(result.themes.length <= 8);
  assert.ok(result.actionItems.length <= 10);
  const inputIds = new Set(comments.map((comment) => comment.id));
  for (const reference of result.themes.flatMap((theme) => theme.commentIds)) {
    assert.ok(inputIds.has(reference));
  }
});
