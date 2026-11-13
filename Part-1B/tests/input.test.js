const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { parseComments, readComments } = require('../src/input');

test('FR-001 parses UTF-8 lines, trims text, removes blanks, and assigns ordered IDs', () => {
  const comments = parseComments('  First feedback  \r\n\r\nSecond feedback\n  Third feedback\t');

  assert.deepEqual(comments, [
    { id: 1, text: 'First feedback' },
    { id: 2, text: 'Second feedback' },
    { id: 3, text: 'Third feedback' }
  ]);
});

test('FR-001 reads UTF-8 input files', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-input-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'comments.txt');
  await fs.writeFile(file, 'Café feedback\n第二条意见', 'utf8');

  assert.deepEqual(await readComments(file), [
    { id: 1, text: 'Café feedback' },
    { id: 2, text: '第二条意见' }
  ]);
});

test('FR-002 accepts empty input and enforces the 1–50 nonblank comment bound', () => {
  assert.deepEqual(parseComments(' \n\t\n'), []);
  assert.equal(parseComments(Array.from({ length: 50 }, (_, index) => `Comment ${index}`).join('\n')).length, 50);
  assert.throws(() => parseComments(Array.from({ length: 51 }, () => 'Comment').join('\n')), /50/);
});

test('FR-002 measures the 500-character limit in Unicode code points', () => {
  assert.equal(parseComments('😀'.repeat(500))[0].text, '😀'.repeat(500));
  assert.throws(() => parseComments('😀'.repeat(501)), /500/);
});

test('FR-002 reports a missing input file', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-missing-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));

  await assert.rejects(readComments(path.join(directory, 'missing.txt')));
});

test('FR-002 reports an unreadable directory as invalid input', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-unreadable-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));

  await assert.rejects(readComments(directory));
});
