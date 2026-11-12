const { isDeepStrictEqual } = require('node:util');
const { PROMPT_VERSION } = require('./prompt');
const { redactText } = require('./redact');

const TOP_LEVEL_KEYS = ['status', 'comments', 'themes', 'sentiment', 'actionItems', 'clarification', 'meta'];
const METADATA_KEYS = ['model', 'temperature', 'promptVersion'];
const SENTIMENT_LABELS = new Set(['positive', 'neutral', 'negative']);
const ACTION_OWNERS = new Set(['TEAM', 'SCRUM_MASTER', 'PRODUCT_OWNER']);
const ABUSIVE_WORDS = new Set([
  'asshole', 'bitch', 'bastard', 'damn', 'fuck', 'fucking', 'fucked', 'fucker',
  'shit', 'shitty', 'slut', 'whore'
]);
function assert(condition, message) {
  if (!condition) {
    const error = new Error(message);
    error.name = 'ValidationError';
    throw error;
  }
}

function hasExactKeys(value, keys) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
}

function isText(value, minimum, maximum) {
  return typeof value === 'string' &&
    [...value].length >= minimum &&
    [...value].length <= maximum;
}

function hasContactData(text) {
  return redactText(text) !== text;
}

function validateGeneratedText(text, label) {
  assert(typeof text === 'string', `${label} must be text`);
  assert(!hasContactData(text), `${label} must not contain contact data`);
  assert(!containsInjectionPhrase(text), `${label} must not echo prompt instructions`);
}

function containsAbusiveWord(text) {
  return (text.match(/[a-z]+/gi) || []).some((word) => ABUSIVE_WORDS.has(word.toLowerCase()));
}

function containsInjectionPhrase(text) {
  const normalized = text.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  return [
    'ignore previous instruction', 'ignore previous instructions',
    'ignore all previous instruction', 'ignore all previous instructions',
    'ignore prior instruction', 'ignore prior instructions',
    'ignore all prior instruction', 'ignore all prior instructions',
    'ignore above instruction', 'ignore above instructions',
    'ignore all above instruction', 'ignore all above instructions',
    'reveal key', 'reveal the key', 'reveal api key', 'reveal the api key',
    'system prompt', 'act as unrestricted', 'act as an unrestricted',
    'act as a unrestricted', 'act as different', 'act as a different',
    'act as an different'
  ].some((phrase) => normalized.includes(phrase));
}

// FR-006, FR-007, FR-008, FR-009, FR-014.
function validateResult(result, { comments, model = 'gemini-3.8-flash' }) {
  assert(hasExactKeys(result, TOP_LEVEL_KEYS), 'Result must contain exactly the required fields');
  assert(result.status === 'OK' || result.status === 'NEEDS_CLARIFICATION', 'Invalid result status');
  assert(Array.isArray(comments), 'Canonical comments must be an array');
  assert(Array.isArray(result.comments) && isDeepStrictEqual(result.comments, comments), 'Result comments must match canonical input');
  assert(hasExactKeys(result.meta, METADATA_KEYS), 'Metadata must contain exactly the required fields');
  assert(result.meta.model === model, 'Metadata model does not match the selected model');
  assert(result.meta.temperature === 0.2, 'Metadata temperature must be 0.2');
  assert(result.meta.promptVersion === PROMPT_VERSION, 'Metadata prompt version is invalid');
  assert(Array.isArray(result.themes), 'Themes must be an array');
  assert(Array.isArray(result.sentiment), 'Sentiment must be an array');
  assert(Array.isArray(result.actionItems), 'Action items must be an array');

  const validIds = new Set(comments.map((comment) => comment.id));
  const referencesAreValid = (ids) =>
    Array.isArray(ids) && ids.length > 0 && ids.every((id) => validIds.has(id));

  if (result.status === 'NEEDS_CLARIFICATION') {
    assert(result.themes.length === 0, 'Clarification results must not contain themes');
    assert(result.sentiment.length === 0, 'Clarification results must not contain sentiment');
    assert(result.actionItems.length === 0, 'Clarification results must not contain action items');
    assert(isText(result.clarification, 1, 500) && result.clarification.trim().endsWith('?'), 'Clarification must be a nonempty question');
    validateGeneratedText(result.clarification, 'Clarification');
    return true;
  }

  assert(result.clarification === null, 'OK results must have null clarification');
  assert(result.themes.length >= 1 && result.themes.length <= 8, 'OK results must have 1–8 themes');
  assert(result.actionItems.length <= 10, 'OK results must have at most 10 action items');
  for (const theme of result.themes) {
    assert(hasExactKeys(theme, ['name', 'commentIds']), 'Theme fields are invalid');
    assert(isText(theme.name, 1, 40), 'Theme name must contain 1–40 characters');
    validateGeneratedText(theme.name, 'Theme name');
    assert(referencesAreValid(theme.commentIds), 'Theme comment references are invalid');
  }

  assert(result.sentiment.length === comments.length, 'There must be exactly one sentiment per comment');
  const sentimentIds = new Set();
  for (const sentiment of result.sentiment) {
    assert(hasExactKeys(sentiment, ['commentId', 'label']), 'Sentiment fields are invalid');
    assert(validIds.has(sentiment.commentId), 'Sentiment references an unknown comment');
    assert(!sentimentIds.has(sentiment.commentId), 'Sentiment contains a duplicate comment');
    assert(SENTIMENT_LABELS.has(sentiment.label), 'Sentiment label is invalid');
    sentimentIds.add(sentiment.commentId);
  }
  assert([...validIds].every((id) => sentimentIds.has(id)), 'Sentiment is missing a comment');

  for (const actionItem of result.actionItems) {
    assert(hasExactKeys(actionItem, ['action', 'owner', 'commentIds']), 'Action item fields are invalid');
    assert(isText(actionItem.action, 1, 120), 'Action text must contain 1–120 characters');
    validateGeneratedText(actionItem.action, 'Action text');
    assert(!containsAbusiveWord(actionItem.action), 'Action text must remain professional');
    assert(ACTION_OWNERS.has(actionItem.owner), 'Action owner is invalid');
    assert(referencesAreValid(actionItem.commentIds), 'Action comment references are invalid');
  }
  if (result.sentiment.some(({ label }) => label === 'negative')) {
    assert(result.actionItems.length > 0, 'Negative feedback requires an action item');
  }
  return true;
}

module.exports = { validateResult };
