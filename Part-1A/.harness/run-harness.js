#!/usr/bin/env node
'use strict';
/*
 * Part 1A harness: independent deterministic quality gates.
 * Written by the human (with Claude), NOT by the coding agent.
 * The coding agent must not modify anything in .harness/ (see harness-rules.md).
 *
 * Usage (from the Part1A folder):
 *   node .harness/run-harness.js --label initial
 *   node .harness/run-harness.js --label repair-1
 *
 * Gates (all must PASS):
 *   1. harness-integrity : .harness/ has no uncommitted changes
 *   2. lint              : npm run lint            (0 errors)
 *   3. security          : npm run security        (0 errors = 0 high findings)
 *   4. audit             : npm audit --audit-level=high (0 high/critical)
 *   5. unit-tests        : node --test on tests/**  (agent's tests, all pass)
 *   6. contract          : harness-owned checks derived from spec.md acceptance criteria
 *   7. traceability      : every FR/NFR ID in spec.md starts at least one test name
 *
 * Output:
 *   evidence/harness-runs/run-NNN-<label>/  (one .txt per gate + summary.json)
 *   evidence/harness-runs/run-NNN-<label>/feedback.md  (only when a gate FAILS)
 *   evidence/harness-results.md            (one row appended per run)
 * Exit code: 0 = PASS, 1 = FAIL.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE = path.join(ROOT, 'evidence');
const RUNS_DIR = path.join(EVIDENCE, 'harness-runs');
const SPEC = path.join(ROOT, 'specs', '001-sprint-capacity-velocity', 'spec.md');
const CLI = path.join(ROOT, 'src', 'cli.js');
const IS_WIN = process.platform === 'win32';
const NPM = IS_WIN ? 'npm.cmd' : 'npm';

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const LABEL = argValue('--label', 'run').replace(/[^a-zA-Z0-9-]/g, '-');

function run(cmd, args, opts = {}) {
  const started = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: opts.shell === true,
    input: opts.input,
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    command: [cmd, ...args].join(' '),
    code: r.status === null ? -1 : r.status,
    stdout: r.stdout || '',
    stderr: (r.stderr || '') + (r.error ? String(r.error) : ''),
    ms: Date.now() - started,
  };
}

function tail(text, lines = 40) {
  const all = text.trim().split(/\r?\n/);
  return all.slice(-lines).join('\n');
}

// ---------- Gate 1: harness integrity ----------
function gateIntegrity() {
  const r = run('git', ['status', '--porcelain', '--', '.harness']);
  const changed = r.stdout.trim();
  const pass = r.code === 0 && changed === '';
  return {
    name: 'harness-integrity',
    pass,
    requirement: 'Constitution IX, harness-rules.md rule 4',
    expected: '.harness/ committed and unchanged (git status shows nothing)',
    observed: r.code !== 0 ? `git failed: ${r.stderr.trim()}` : changed === '' ? 'no changes' : `changed files:\n${changed}`,
    raw: r,
  };
}

// ---------- Gates 2-4: npm scripts ----------
function gateNpm(name, args, requirement, expected) {
  const r = run(NPM, args, { shell: IS_WIN });
  return {
    name,
    pass: r.code === 0,
    requirement,
    expected,
    observed: `exit code ${r.code}\n${tail(r.stdout + '\n' + r.stderr, 30)}`,
    raw: r,
  };
}

// ---------- Gate 5: the agent's unit tests ----------
function gateUnitTests() {
  // Explicit glob so copies under evidence/ are never run.
  const r = run(process.execPath, ['--test', '--test-reporter=tap', 'tests/**/*.test.js']);
  const lines = r.stdout.split(/\r?\n/);
  const failed = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^\s*not ok \d+ - (.*)$/);
    if (m) {
      const detail = [];
      for (let j = i + 1; j < lines.length && j < i + 25; j += 1) {
        if (/^\s*(not )?ok \d+ - /.test(lines[j])) break;
        detail.push(lines[j]);
      }
      failed.push({ name: m[1].trim(), detail: detail.join('\n') });
    }
  }
  const pass = r.code === 0;
  const count = (key) => {
    const m = r.stdout.match(new RegExp(`^# ${key} (\\d+)`, 'm'));
    return m ? Number(m[1]) : null;
  };
  return {
    name: 'unit-tests',
    pass,
    requirement: 'NFR-004 (all FR/NFR tests must pass)',
    expected: 'all tests pass',
    observed: `tests ${count('tests')}, pass ${count('pass')}, fail ${count('fail')}` +
      (failed.length ? `\nFailing tests:\n${failed.map((f) => `- ${f.name}`).join('\n')}` : ''),
    failedTests: failed,
    raw: r,
  };
}

// ---------- Gate 6: harness-owned contract checks (from spec.md) ----------
const WORKED = {
  sprintLengthDays: 10,
  team: [
    { name: 'Asha', leaveDays: 2 },
    { name: 'Ben' },
    { name: 'Chitra', allocation: 0.5 },
    { name: 'Dev' },
  ],
  pastVelocities: [18, 22, 26, 24],
  plannedPoints: 25,
};
const JSON_KEYS = ['fullCapacityDays', 'availableCapacityDays', 'averageVelocity',
  'forecastPoints', 'plannedPoints', 'verdict', 'differencePoints'];

function gateContract() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-'));
  const write = (fileName, data) => {
    const p = path.join(tmp, fileName);
    fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data));
    return p;
  };
  const cli = (args) => run(process.execPath, [CLI, ...args]);
  const variant = (changes) => ({ ...JSON.parse(JSON.stringify(WORKED)), ...changes });
  const checks = [];
  const check = (id, title, fn) => {
    let ok = false;
    let observed = '';
    try {
      const res = fn();
      ok = res.ok;
      observed = res.observed;
    } catch (e) {
      observed = `harness check error: ${e.message}`;
    }
    checks.push({ id, title, ok, observed });
  };
  const parse = (r) => { try { return JSON.parse(r.stdout); } catch { return null; } };
  const noStack = (s) => !/\n\s+at\s/.test(s);
  const errorCase = (r, fieldWord) =>
    r.code === 1 && r.stdout.trim() === '' && r.stderr.startsWith('Error:') &&
    r.stderr.includes(fieldWord) && noStack(r.stderr);
  const show = (r) => `exit ${r.code}; stdout: ${JSON.stringify(r.stdout.trim().slice(0, 300))}; stderr: ${JSON.stringify(r.stderr.trim().slice(0, 300))}`;

  const worked = write('worked.json', WORKED);

  check('FR-003/004/005/006/007/010', 'worked example JSON values and key order (AC-003..AC-007, AC-010)', () => {
    const r = cli(['report', worked, '--json']);
    const o = parse(r);
    const ok = r.code === 0 && o !== null &&
      JSON.stringify(Object.keys(o)) === JSON.stringify(JSON_KEYS) &&
      o.fullCapacityDays === 35 && o.availableCapacityDays === 33 && o.averageVelocity === 24 &&
      o.forecastPoints === 22 && o.plannedPoints === 25 &&
      o.verdict === 'OVER_COMMITTED' && o.differencePoints === 3;
    return { ok, observed: show(r) };
  });

  check('FR-009', 'readable report ends with the exact verdict line (AC-009)', () => {
    const r = cli(['report', worked]);
    const lines = r.stdout.trim().split(/\r?\n/);
    const ok = r.code === 0 && lines.length === 6 && lines[5] === 'Verdict: OVER_COMMITTED by 3 points';
    return { ok, observed: show(r) };
  });

  const verdictCase = (planned, verdict, diff) => () => {
    const r = cli(['report', write(`planned-${planned}.json`, variant({ plannedPoints: planned })), '--json']);
    const o = parse(r);
    return { ok: r.code === 0 && o && o.verdict === verdict && o.differencePoints === diff, observed: show(r) };
  };
  check('FR-007', 'planned 22 = forecast is FITS, difference 0', verdictCase(22, 'FITS', 0));
  check('FR-007', 'planned 18 (>= 80% of 22) is FITS, difference 0', verdictCase(18, 'FITS', 0));
  check('FR-007', 'planned 17 (< 80% of 22) is UNDER_COMMITTED by 5', verdictCase(17, 'UNDER_COMMITTED', 5));

  check('FR-008', 'empty history gives NO_HISTORY with nulls, exit 0 (AC-008)', () => {
    const r = cli(['report', write('no-history.json', variant({ pastVelocities: [] })), '--json']);
    const o = parse(r);
    const ok = r.code === 0 && o && o.verdict === 'NO_HISTORY' && o.availableCapacityDays === 33 &&
      o.averageVelocity === null && o.forecastPoints === null && o.differencePoints === null;
    return { ok, observed: show(r) };
  });

  check('FR-011', 'sprintLengthDays 31 rejected naming the field (AC-011)', () => {
    const r = cli(['report', write('bad-length.json', variant({ sprintLengthDays: 31 }))]);
    return { ok: errorCase(r, 'sprintLengthDays'), observed: show(r) };
  });
  check('FR-012', 'duplicate member names rejected (AC-012)', () => {
    const team = [{ name: 'Asha' }, { name: ' asha ' }];
    const r = cli(['report', write('dup.json', variant({ team }))]);
    return { ok: errorCase(r, 'name'), observed: show(r) };
  });
  check('FR-013', 'leaveDays above sprint length rejected naming the field (AC-013)', () => {
    const team = [{ name: 'Asha', leaveDays: 11 }];
    const r = cli(['report', write('bad-leave.json', variant({ team }))]);
    return { ok: errorCase(r, 'leaveDays'), observed: show(r) };
  });
  check('FR-014', 'allocation 1.5 rejected naming the field (AC-014)', () => {
    const team = [{ name: 'Asha', allocation: 1.5 }];
    const r = cli(['report', write('bad-alloc.json', variant({ team }))]);
    return { ok: errorCase(r, 'allocation'), observed: show(r) };
  });
  check('FR-015', 'fractional plannedPoints rejected naming the field (AC-015)', () => {
    const r = cli(['report', write('bad-planned.json', variant({ plannedPoints: 2.5 }))]);
    return { ok: errorCase(r, 'plannedPoints'), observed: show(r) };
  });
  check('FR-016', 'missing file gives "Error: file not found: <path>" (AC-016)', () => {
    const missing = path.join(tmp, 'does-not-exist.json');
    const r = cli(['report', missing]);
    const ok = r.code === 1 && r.stdout.trim() === '' &&
      r.stderr.trim().startsWith('Error: file not found:') && r.stderr.includes('does-not-exist.json') && noStack(r.stderr);
    return { ok, observed: show(r) };
  });
  check('FR-016', 'malformed JSON gives "Error: invalid JSON in <path>" (AC-016)', () => {
    const r = cli(['report', write('broken.json', '{ "sprintLengthDays": 10, ')]);
    const ok = r.code === 1 && r.stdout.trim() === '' &&
      r.stderr.trim().startsWith('Error: invalid JSON in') && r.stderr.includes('broken.json') && noStack(r.stderr);
    return { ok, observed: show(r) };
  });
  check('FR-018', 'identical input gives byte-identical output (AC-018)', () => {
    const a = cli(['report', worked]);
    const b = cli(['report', worked]);
    return { ok: a.code === 0 && a.stdout === b.stdout, observed: `run1 ${JSON.stringify(a.stdout)} | run2 ${JSON.stringify(b.stdout)}` };
  });

  fs.rmSync(tmp, { recursive: true, force: true });
  const failed = checks.filter((c) => !c.ok);
  return {
    name: 'contract',
    pass: failed.length === 0,
    requirement: 'spec.md acceptance criteria (harness-owned, independent of agent tests)',
    expected: `${checks.length} contract checks pass`,
    observed: `${checks.length - failed.length}/${checks.length} passed` +
      (failed.length ? `\n${failed.map((c) => `- [${c.id}] ${c.title}\n  observed: ${c.observed}`).join('\n')}` : ''),
    checks,
    raw: { command: 'node src/cli.js report <temp files> [--json]', code: failed.length ? 1 : 0, stdout: JSON.stringify(checks, null, 2), stderr: '', ms: 0 },
  };
}

// ---------- Gate 7: traceability spec -> test names ----------
function listJs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? listJs(p) : p.endsWith('.js') ? [p] : [];
  });
}
function gateTraceability() {
  const spec = fs.existsSync(SPEC) ? fs.readFileSync(SPEC, 'utf8') : '';
  const ids = [...new Set(spec.match(/\b(?:FR|NFR)-\d{3}\b/g) || [])].sort();
  const testText = listJs(path.join(ROOT, 'tests')).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const missing = ids.filter((id) => !new RegExp(`\\b(?:test|it|describe)\\s*\\(\\s*['"\`]${id}\\b`).test(testText));
  return {
    name: 'traceability',
    pass: ids.length > 0 && missing.length === 0,
    requirement: 'Constitution IV, NFR-004',
    expected: 'every FR/NFR ID in spec.md starts at least one test name',
    observed: ids.length === 0 ? 'no IDs found in spec.md' :
      `${ids.length - missing.length}/${ids.length} IDs covered` + (missing.length ? `\nMissing: ${missing.join(', ')}` : ''),
    raw: { command: 'scan spec.md IDs vs tests/**/*.js test names', code: missing.length ? 1 : 0, stdout: `IDs: ${ids.join(', ')}\nMissing: ${missing.join(', ') || 'none'}`, stderr: '', ms: 0 },
  };
}

// ---------- Run everything ----------
function nextRunDir() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const nums = fs.readdirSync(RUNS_DIR).map((n) => Number((n.match(/^run-(\d+)/) || [])[1])).filter(Boolean);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const dir = path.join(RUNS_DIR, `run-${String(n).padStart(3, '0')}-${LABEL}`);
  fs.mkdirSync(dir);
  return { n, dir };
}

function main() {
  const startedAt = new Date().toISOString();
  const commit = run('git', ['rev-parse', '--short', 'HEAD']).stdout.trim() || 'unknown';
  const gates = [
    gateIntegrity(),
    gateNpm('lint', ['run', 'lint'], 'Constitution VIII, NFR-005 (lint 0 errors)', 'exit code 0 (0 lint errors)'),
    gateNpm('security', ['run', 'security'], 'Constitution VII/VIII, NFR-002 (0 high findings)', 'exit code 0 (0 security errors)'),
    gateNpm('audit', ['audit', '--audit-level=high'], 'Constitution VIII (0 high/critical vulnerabilities)', 'exit code 0'),
    gateUnitTests(),
    gateContract(),
    gateTraceability(),
  ];
  const pass = gates.every((g) => g.pass);
  const { n, dir } = nextRunDir();

  for (const g of gates) {
    fs.writeFileSync(path.join(dir, `${g.name}.txt`),
      `Gate: ${g.name}\nResult: ${g.pass ? 'PASS' : 'FAIL'}\nCommand: ${g.raw.command}\nExit code: ${g.raw.code}\nDuration: ${g.raw.ms} ms\n\n--- stdout ---\n${g.raw.stdout}\n--- stderr ---\n${g.raw.stderr}\n`);
  }
  const summary = {
    run: n, label: LABEL, startedAt, commit,
    environment: { node: process.version, platform: `${process.platform} ${os.release()}` },
    result: pass ? 'PASS' : 'FAIL',
    gates: gates.map((g) => ({ name: g.name, result: g.pass ? 'PASS' : 'FAIL', requirement: g.requirement, observed: g.observed })),
  };
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));

  if (!pass) {
    const failed = gates.filter((g) => !g.pass);
    const fb = [
      `# Harness feedback – run ${n} (${LABEL})`,
      '',
      `Result: **FAIL** · commit ${commit} · ${startedAt} · Node ${process.version} on ${process.platform}`,
      '',
      'Fix the implementation (or a test only if it contradicts spec.md). Do NOT modify .harness/, delete or weaken tests, lower assertions, disable lint/security rules, or change acceptance criteria to obtain a PASS. A legitimate requirement change must go through spec.md and be recorded.',
      '',
      ...failed.flatMap((g) => [
        `## Gate failed: ${g.name}`,
        `- Requirement: ${g.requirement}`,
        `- Command: \`${g.raw.command}\``,
        `- Expected: ${g.expected}`,
        '- Observed:',
        '```text',
        g.observed,
        '```',
        ...(g.failedTests || []).flatMap((t) => [`### Failing test: ${t.name}`, '```text', t.detail.trim(), '```']),
        '',
      ]),
    ].join('\n');
    fs.writeFileSync(path.join(dir, 'feedback.md'), fb);
  }

  const resultsFile = path.join(EVIDENCE, 'harness-results.md');
  if (!fs.existsSync(resultsFile)) {
    fs.writeFileSync(resultsFile, `# Harness results (Part 1A)\n\nGenerated by .harness/run-harness.js. Do not edit by hand.\n\n| Run | Label | Date (UTC) | Commit | ${gates.map((g) => g.name).join(' | ')} | Result |\n|---|---|---|---|${gates.map(() => '---').join('|')}|---|\n`);
  }
  fs.appendFileSync(resultsFile, `| ${n} | ${LABEL} | ${startedAt} | ${commit} | ${gates.map((g) => (g.pass ? 'PASS' : '**FAIL**')).join(' | ')} | ${pass ? 'PASS' : '**FAIL**'} |\n`);

  console.log(`\nHarness run ${n} (${LABEL}) – commit ${commit}\n`);
  for (const g of gates) console.log(`  ${g.pass ? 'PASS' : 'FAIL'}  ${g.name.padEnd(18)} ${g.observed.split('\n')[0]}`);
  console.log(`\nOVERALL: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`Evidence: ${path.relative(ROOT, dir)}${pass ? '' : `  (feedback: ${path.relative(ROOT, path.join(dir, 'feedback.md'))})`}\n`);
  process.exit(pass ? 0 : 1);
}

main();
