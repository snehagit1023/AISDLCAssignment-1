'use strict';
// Layer 1 – structural validation (FR-006). Independent of src/validate.js.

const TOP_KEYS = ['status', 'comments', 'themes', 'sentiment', 'actionItems', 'clarification', 'meta'];
const META_KEYS = ['model', 'temperature', 'promptVersion'];
const STATUSES = ['OK', 'NEEDS_CLARIFICATION'];
const LABELS = ['positive', 'neutral', 'negative'];
const OWNERS = ['TEAM', 'SCRUM_MASTER', 'PRODUCT_OWNER'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameKeys(value, keys) {
  return isObject(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function lengthOk(text, min, max) {
  return typeof text === 'string' && [...text].length >= min && [...text].length <= max;
}

function isIntArray(value) {
  return Array.isArray(value) && value.every(Number.isInteger);
}

// Returns { pass, checks: [{ id, requirement, pass, detail }] }.
function checkSchema(run) {
  const checks = [];
  const add = (id, requirement, pass, detail) => checks.push({ id, requirement, pass: Boolean(pass), detail });

  add('L1-exit-code', 'FR-006', run.exitCode === 0, `exit code ${run.exitCode}`);
  add('L1-stderr-empty', 'FR-006', run.stderr.trim() === '', run.stderr.trim() === '' ? 'stderr empty' : `stderr: ${run.stderr.trim().slice(0, 200)}`);

  const lines = run.stdout.split(/\r?\n/).filter((line) => line.trim() !== '');
  let result;
  try {
    if (lines.length !== 1) throw new Error(`${lines.length} non-empty stdout lines`);
    result = JSON.parse(lines[0]);
  } catch (error) {
    add('L1-single-json', 'FR-006', false, `stdout is not exactly one JSON object: ${error.message}`);
    return { pass: false, checks, result: undefined };
  }
  add('L1-single-json', 'FR-006', isObject(result), 'stdout is one JSON object');
  if (!isObject(result)) return { pass: false, checks, result: undefined };

  add('L1-top-level-keys', 'FR-006', sameKeys(result, TOP_KEYS), `keys: ${Object.keys(result).join(', ')}`);
  add('L1-status-enum', 'FR-006', STATUSES.includes(result.status), `status: ${result.status}`);

  const comments = Array.isArray(result.comments) ? result.comments : null;
  add('L1-comments-shape', 'FR-006',
    comments && comments.every((c) => sameKeys(c, ['id', 'text']) && Number.isInteger(c.id) && typeof c.text === 'string'),
    'comments: [{ id: integer, text: string }]');

  const themes = Array.isArray(result.themes) ? result.themes : null;
  add('L1-themes-shape', 'FR-006, FR-007',
    themes && themes.every((t) => sameKeys(t, ['name', 'commentIds']) && lengthOk(t.name, 1, 40) && isIntArray(t.commentIds)),
    'themes: [{ name: 1-40 chars, commentIds: integer[] }]');

  const sentiment = Array.isArray(result.sentiment) ? result.sentiment : null;
  add('L1-sentiment-shape', 'FR-006, FR-007',
    sentiment && sentiment.every((s) => sameKeys(s, ['commentId', 'label']) && Number.isInteger(s.commentId) && LABELS.includes(s.label)),
    'sentiment: [{ commentId: integer, label: positive|neutral|negative }]');

  const actions = Array.isArray(result.actionItems) ? result.actionItems : null;
  add('L1-actions-shape', 'FR-006, FR-007',
    actions && actions.every((a) => sameKeys(a, ['action', 'owner', 'commentIds']) && lengthOk(a.action, 1, 120) && OWNERS.includes(a.owner) && isIntArray(a.commentIds)),
    'actionItems: [{ action: 1-120 chars, owner: TEAM|SCRUM_MASTER|PRODUCT_OWNER, commentIds: integer[] }]');

  add('L1-clarification-type', 'FR-006', result.clarification === null || typeof result.clarification === 'string',
    `clarification type: ${result.clarification === null ? 'null' : typeof result.clarification}`);

  const meta = result.meta;
  add('L1-meta-shape', 'FR-006', sameKeys(meta, META_KEYS) && typeof meta.model === 'string' && meta.model !== '' &&
    typeof meta.promptVersion === 'string' && meta.promptVersion !== '', `meta: ${JSON.stringify(meta)}`);
  add('L1-meta-temperature', 'FR-006', isObject(meta) && meta.temperature === 0.2, `temperature: ${isObject(meta) ? meta.temperature : 'n/a'}`);

  return { pass: checks.every((c) => c.pass), checks, result };
}

module.exports = { checkSchema };
