'use strict';
// Layer 3 – semantic / quality score from 0 to 1 (FR-012, FR-013).
// Score = average of the parts that apply (see evals/dataset.json "rules.qualityScore"):
//   themes    : share of expected themes found (a theme name contains any listed keyword)
//   sentiment : share of expected sentiment labels matched
//   actions   : share of action-keyword groups found in the action items
// NEEDS_CLARIFICATION cases: 1 if status matches and clarification ends with "?", else 0.

function lower(text) {
  return String(text || '').toLowerCase();
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function scoreQuality(testCase, result) {
  const expected = testCase.expected;
  const parts = {};

  if (expected.status === 'NEEDS_CLARIFICATION') {
    const ok = result.status === 'NEEDS_CLARIFICATION' && typeof result.clarification === 'string' && result.clarification.trim().endsWith('?');
    parts.clarification = { score: ok ? 1 : 0, detail: ok ? 'clarification question returned' : 'no clarification question' };
    return { score: parts.clarification.score, parts };
  }

  const themeNames = (result.themes || []).map((t) => lower(t.name));
  const expectedThemes = expected.themes || [];
  if (expectedThemes.length > 0) {
    const found = expectedThemes.filter((t) => themeNames.some((name) => t.anyOf.some((k) => name.includes(lower(k)))));
    const missing = expectedThemes.filter((t) => !found.includes(t)).map((t) => t.name);
    parts.themes = { score: found.length / expectedThemes.length, detail: `${found.length}/${expectedThemes.length} expected themes found${missing.length ? `; missing: ${missing.join(', ')}` : ''}; got: ${themeNames.join(' | ')}` };
  }

  const expectedSentiment = Object.entries(expected.sentiment || {});
  if (expectedSentiment.length > 0) {
    const byId = new Map((result.sentiment || []).map((s) => [String(s.commentId), s.label]));
    const wrong = expectedSentiment.filter(([id, label]) => byId.get(id) !== label);
    parts.sentiment = { score: (expectedSentiment.length - wrong.length) / expectedSentiment.length, detail: `${expectedSentiment.length - wrong.length}/${expectedSentiment.length} sentiment labels match${wrong.length ? `; differ: ${wrong.map(([id, label]) => `#${id} expected ${label}, got ${byId.get(id)}`).join(', ')}` : ''}` };
  }

  const groups = expected.actionKeywords || [];
  if (groups.length > 0) {
    const actionText = (result.actionItems || []).map((a) => lower(a.action)).join(' | ');
    const found = groups.filter((g) => g.some((k) => actionText.includes(lower(k))));
    parts.actions = { score: found.length / groups.length, detail: `${found.length}/${groups.length} action keyword groups found; actions: ${actionText}` };
  }

  const scores = Object.values(parts).map((p) => p.score);
  const score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
  for (const p of Object.values(parts)) p.score = round(p.score);
  return { score: round(score), parts };
}

module.exports = { scoreQuality };
