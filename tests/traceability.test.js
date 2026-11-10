const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..');

test('NFR-001 supports Node.js 20+, CommonJS, built-in runtime dependencies, and a CLI-only entry point', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
  );

  assert.match(packageJson.engines.node, />=?\s*20/);
  assert.equal(packageJson.type, 'commonjs');
  assert.deepEqual(packageJson.dependencies || {}, {});
  assert.ok(fs.existsSync(path.join(projectRoot, 'src', 'cli.js')));
  assert.equal(packageJson.scripts.start, undefined);
  assert.equal(packageJson.scripts.dev, undefined);
});

test('NFR-002 keeps source offline and non-executable while exposing the security gate', () => {
  const sourceDirectory = path.join(projectRoot, 'src');
  const sourceFiles = fs.existsSync(sourceDirectory)
    ? fs.readdirSync(sourceDirectory)
      .filter((name) => name.endsWith('.js'))
      .map((name) => fs.readFileSync(path.join(sourceDirectory, name), 'utf8'))
    : [];
  const source = sourceFiles.join('\n');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
  );

  assert.doesNotMatch(source, /\bfetch\s*\(|\bhttps?:\/\/|node:https|node:http|\baxios\b/i);
  assert.doesNotMatch(source, /\beval\s*\(|\bnew\s+Function\b|\b(?:child_process|execFile|execSync|spawn|spawnSync)\b/);
  assert.doesNotMatch(source, /\b(?:api[_-]?key|secret)\b/i);
  assert.doesNotMatch(source, /\b[A-Z]:\\|\/home\/|\/Users\//);
  assert.equal(typeof packageJson.scripts.security, 'string');
});

test('NFR-004 provides ID-prefixed tests for every requirement and failure tests for validation rules', () => {
  const testsDirectory = path.join(projectRoot, 'tests');
  const testSources = fs.readdirSync(testsDirectory)
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => fs.readFileSync(path.join(testsDirectory, name), 'utf8'));
  const testNames = testSources.flatMap((source) => {
    const names = [];
    const expression = /\btest\(\s*'([^']+)'/g;
    let match = expression.exec(source);

    while (match) {
      names.push(match[1]);
      match = expression.exec(source);
    }

    return names;
  });

  for (let number = 1; number <= 18; number += 1) {
    const requirementId = `FR-${String(number).padStart(3, '0')}`;
    assert.ok(
      testNames.some((name) => name.startsWith(`${requirementId} `)),
      `Missing test for ${requirementId}`,
    );
  }
  for (let number = 1; number <= 5; number += 1) {
    const requirementId = `NFR-${String(number).padStart(3, '0')}`;
    assert.ok(
      testNames.some((name) => name.startsWith(`${requirementId} `)),
      `Missing test for ${requirementId}`,
    );
  }
  for (let number = 11; number <= 17; number += 1) {
    const requirementId = `FR-${String(number).padStart(3, '0')}`;
    assert.ok(
      testNames.some((name) => name.startsWith(`${requirementId} `) && /reject|invalid|failure|missing|malformed|unreadable|argument/i.test(name)),
      `Missing failure-case test for ${requirementId}`,
    );
  }
});

test('NFR-005 places implementation comments for every functional requirement in source modules', () => {
  const source = ['calculator.js', 'cli.js']
    .map((name) => fs.readFileSync(path.join(projectRoot, 'src', name), 'utf8'))
    .join('\n');

  for (let number = 1; number <= 18; number += 1) {
    const requirementId = `FR-${String(number).padStart(3, '0')}`;
    assert.ok(
      source.includes(`// ${requirementId}`),
      `Missing implementation comment for ${requirementId}`,
    );
  }
});
