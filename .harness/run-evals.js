#!/usr/bin/env node
'use strict';
/*
 * Part 1B evaluation harness – one pipeline for the Retro Feedback Assistant.
 * Human-owned: the coding agent must not modify .harness/ or evals/ (harness-rules.md rule 4).
 *
 * Usage (from the Part1B folder):
 *   node .harness/run-evals.js --label initial
 *   node .harness/run-evals.js --label repair-1
 * Options:
 *   --cases C01,C10   evaluate only some cases (debugging; the run is then marked PARTIAL, never PASS)
 *   --skip-gates      skip the code gates (debugging; the run is then marked PARTIAL, never PASS)
 *   --delay-ms 4000   pause between cases to stay within the free-tier rate limit (default 4000)
 *
 * Pipeline:
 *   A. Code gates      integrity, lint, security, audit, unit tests, builtins-only, traceability
 *   B. For each of the 15 cases in evals/dataset.json:
 *        write the comments to a temp file -> node src/cli.js analyze <file> (real Gemini call)
 *        Layer 1 schema        (.harness/evaluators/schema.js)
 *        Layer 2 invariants    (.harness/evaluators/invariants.js)
 *        Layer 3 quality 0..1  (.harness/evaluators/quality.js)
 *        case PASS = L1 pass + L2 pass + quality >= 0.6
 *        "Error: AI service unavailable" (exit 2) = SERVICE_FAILURE, counted separately
 *   C. Aggregate: PASS = all gates pass, >= 12 of 15 cases pass, all safety cases pass
 *                 INCONCLUSIVE = more than 3 service failures (repeat the run)
 *   D. SC-005: tally of the Product Owner's 5 ratings in evals/po-ratings.json (if present)
 *
 * Evidence:
 *   evidence/eval-runs/run-NNN-<label>/  gates/*.txt, cases/<id>.json, summary.json,
 *                                        po-review.md, feedback.md (when not PASS)
 *   evidence/eval-results.json           latest run summary
 *   evidence/eval-results.md             one row appended per run
 * Exit code: 0 = PASS, 1 = FAIL, 2 = INCONCLUSIVE, 3 = PARTIAL (debug run).
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { checkSchema } = require('./evaluators/schema');
const { checkInvariants } = require('./evaluators/invariants');
const { scoreQuality } = require('./evaluators/quality');

const ROOT = path.resolve(__dirname, '..');
const DATASET = path.join(ROOT, 'evals', 'dataset.json');
const PO_RATINGS = path.join(ROOT, 'evals', 'po-ratings.json');
const SPEC = path.join(ROOT, 'specs', '001-retro-feedback-assistant', 'spec.md');
const EVIDENCE = path.join(ROOT, 'evidence');
const RUNS_DIR = path.join(EVIDENCE, 'eval-runs');
const IS_WIN = process.platform === 'win32';
const NPM = IS_WIN ? 'npm.cmd' : 'npm';

const CASE_THRESHOLD = 0.6;
const OVERALL_MIN_PASS = 12;
const MAX_SERVICE_FAILURES = 3;
const PO_SAMPLE = ['C01', 'C02', 'C03', 'C04', 'C05'];
const PO_MIN_CLEAR = 4;

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const LABEL = argValue('--label', 'run').replace(/[^a-zA-Z0-9-]/g, '-');
const ONLY = argValue('--cases', '') ? argValue('--cases', '').split(',').map((s) => s.trim()) : null;
const SKIP_GATES = process.argv.includes('--skip-gates');
const DELAY_MS = Number(argValue('--delay-ms', '4000'));
const CLI = path.resolve(ROOT, argValue('--cli', path.join('src', 'cli.js')));

function run(cmd, args, opts = {}) {
  const started = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: opts.shell === true,
    env: opts.env || process.env,
    timeout: opts.timeout,
    maxBuffer: 50 * 1024 * 1024
  });
  return {
    command: [cmd, ...args].join(' '),
    exitCode: r.status === null ? -1 : r.status,
    stdout: r.stdout || '',
    stderr: (r.stderr || '') + (r.error ? String(r.error) : ''),
    ms: Date.now() - started
  };
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function tail(text, lines = 40) {
  return text.trim().split(/\r?\n/).slice(-lines).join('\n');
}

// ---------------- A. Code gates ----------------
function gateIntegrity() {
  const status = run('git', ['status', '--porcelain', '--', '.harness', 'evals']);
  const tracked = run('git', ['ls-files', '--', '.harness/run-evals.js', 'evals/dataset.json']);
  const changed = status.stdout.trim();
  const trackedOk = tracked.stdout.includes('run-evals.js') && tracked.stdout.includes('dataset.json');
  return {
    name: 'integrity', requirement: 'Constitution X, harness-rules.md rule 4, FR-012',
    pass: status.exitCode === 0 && changed === '' && trackedOk,
    expected: '.harness/ and evals/ committed and unchanged',
    observed: status.exitCode !== 0 ? `git failed: ${status.stderr.trim()}` : `${changed === '' ? 'no uncommitted changes' : `changed:\n${changed}`}; tracked: ${trackedOk}`
  };
}

function gateCommand(name, args, requirement, expected) {
  const r = run(NPM, args, { shell: IS_WIN });
  return { name, requirement, pass: r.exitCode === 0, expected, observed: `exit ${r.exitCode}\n${tail(r.stdout + r.stderr)}`, command: r.command };
}

function testNames() {
  const dir = path.join(ROOT, 'tests');
  const names = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.test.js')) {
        const src = fs.readFileSync(p, 'utf8');
        const re = /\b(?:test|it)\(\s*(['"`])([^'"`]*)/g;
        let m;
        while ((m = re.exec(src)) !== null) names.push({ file: path.relative(ROOT, p), name: m[2] });
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return names;
}

function gateTraceability(dataset) {
  const spec = fs.readFileSync(SPEC, 'utf8');
  const frIds = [...new Set(spec.match(/\*\*FR-\d{3}\*\*/g).map((s) => s.replace(/\*/g, '')))];
  const names = testNames();
  const problems = [];
  const badNames = names.filter((t) => !/^(FR|SC)-\d{3}/.test(t.name));
  if (badNames.length) problems.push(`test names not starting with an FR/SC ID: ${badNames.map((t) => `${t.file}: "${t.name}"`).join('; ')}`);
  const caseIds = new Set(dataset.cases.flatMap((c) => c.requirements || []));
  const casesWithout = dataset.cases.filter((c) => !Array.isArray(c.requirements) || c.requirements.length === 0).map((c) => c.id);
  if (casesWithout.length) problems.push(`evaluation cases without FR IDs: ${casesWithout.join(', ')}`);
  const unknown = [...caseIds].filter((id) => !frIds.includes(id));
  if (unknown.length) problems.push(`evaluation cases reference unknown IDs: ${unknown.join(', ')}`);
  // FR-011 is verified by the builtins-only gate and FR-014 by this gate itself.
  const harnessVerified = new Set(['FR-011', 'FR-014']);
  const uncovered = frIds.filter((id) => !names.some((t) => t.name.startsWith(id)) && !caseIds.has(id) && !harnessVerified.has(id));
  if (uncovered.length) problems.push(`requirements with no test and no evaluation case: ${uncovered.join(', ')}`);
  const srcDir = path.join(ROOT, 'src');
  const noComment = fs.readdirSync(srcDir).filter((f) => f.endsWith('.js') && !/FR-\d{3}/.test(fs.readFileSync(path.join(srcDir, f), 'utf8')));
  if (noComment.length) problems.push(`src files without an FR comment: ${noComment.join(', ')}`);
  return {
    name: 'traceability', requirement: 'FR-014, Constitution IV',
    pass: problems.length === 0,
    expected: 'every test name starts with an FR/SC ID; every FR has a test or evaluation case; every case lists FR IDs; every src file has an FR comment',
    observed: problems.length ? problems.join('\n') : `${names.length} test names, ${frIds.length} FRs covered, ${dataset.cases.length} cases mapped`
  };
}

function gateBuiltinsOnly() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const problems = [];
  if (pkg.dependencies && Object.keys(pkg.dependencies).length) problems.push(`runtime dependencies: ${Object.keys(pkg.dependencies).join(', ')}`);
  const srcDir = path.join(ROOT, 'src');
  for (const f of fs.readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(srcDir, f), 'utf8');
    for (const m of src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (!m[1].startsWith('node:') && !m[1].startsWith('./')) problems.push(`${f} requires "${m[1]}"`);
    }
    if (/\bfetch\s*\(|globalThis\.fetch/.test(src) && f !== 'ai-client.js') problems.push(`${f} calls fetch (only ai-client.js may)`);
  }
  return {
    name: 'builtins-only', requirement: 'FR-011, style-guide rules 2 and 4',
    pass: problems.length === 0,
    expected: 'no runtime dependencies; src/ requires only node: built-ins or local files; only ai-client.js calls fetch',
    observed: problems.length ? problems.join('\n') : 'no runtime dependencies; only built-in and local modules; fetch only in ai-client.js'
  };
}

// ---------------- B. Evaluate one case ----------------
function evaluateCase(testCase, tmpDir) {
  const file = path.join(tmpDir, `${testCase.id}.txt`);
  fs.writeFileSync(file, testCase.comments.join('\n'), 'utf8');
  const env = { ...process.env };
  // C15 (empty input) must work without any AI call: run it with no key at all (FR-008).
  if (testCase.expected.noAiCall) env.GEMINI_API_KEY = '';
  const r = run(process.execPath, [CLI, 'analyze', file], { env, timeout: 150000 });
  const record = { id: testCase.id, title: testCase.title, category: testCase.category, safety: testCase.safety,
    requirements: testCase.requirements, ms: r.ms, exitCode: r.exitCode, stderr: r.stderr.trim() };

  if (r.exitCode === 2 && r.stderr.startsWith('Error: AI service unavailable')) {
    return { ...record, outcome: 'SERVICE_FAILURE', pass: false, stdout: r.stdout };
  }
  const l1 = checkSchema(r);
  if (!l1.pass) {
    return { ...record, outcome: 'FAIL', pass: false, stdout: r.stdout, layer1: l1, layer2: null, layer3: null };
  }
  const l2 = checkInvariants(testCase, r, l1.result);
  const l3 = scoreQuality(testCase, l1.result);
  const pass = l2.pass && l3.score >= CASE_THRESHOLD;
  return { ...record, outcome: pass ? 'PASS' : 'FAIL', pass, output: l1.result, layer1: l1, layer2: l2, layer3: l3 };
}

// Evidence copies mask the abusive words that the dataset itself contains (SC-003). Checks run on raw output.
function maskWords(dataset) {
  const words = [...new Set(dataset.cases.flatMap((c) => c.expected.forbiddenInActionItems || []))];
  return (text) => words.reduce((t, w) => t.replace(new RegExp(`\\b${w}\\b`, 'gi'), (m) => `${m[0]}***`), text);
}

function nextRunDir() {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const nums = fs.readdirSync(RUNS_DIR).map((d) => Number((d.match(/^run-(\d+)/) || [])[1])).filter(Number.isFinite);
  const n = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  return { id: `run-${n}-${LABEL}`, dir: path.join(RUNS_DIR, `run-${n}-${LABEL}`) };
}

function failedChecks(c) {
  if (c.outcome === 'SERVICE_FAILURE') return [`service failure: ${c.stderr}`];
  const out = [];
  for (const layer of [c.layer1, c.layer2]) {
    for (const k of (layer && layer.checks) || []) if (!k.pass) out.push(`${k.id} (${k.requirement}): ${k.detail}`);
  }
  if (c.layer3 && c.layer3.score < CASE_THRESHOLD) {
    out.push(`L3 quality ${c.layer3.score} < ${CASE_THRESHOLD} (FR-013): ${Object.entries(c.layer3.parts).map(([k, p]) => `${k} ${p.score} – ${p.detail}`).join('; ')}`);
  }
  return out;
}

function poTally(results) {
  if (!fs.existsSync(PO_RATINGS)) return { status: 'PENDING', detail: 'evals/po-ratings.json not found – rate the 5 outputs in po-review.md' };
  const data = JSON.parse(fs.readFileSync(PO_RATINGS, 'utf8'));
  const ratings = (data.ratings || []).filter((r) => PO_SAMPLE.includes(r.caseId));
  if (ratings.length !== PO_SAMPLE.length) return { status: 'PENDING', detail: `${ratings.length} of ${PO_SAMPLE.length} ratings recorded` };
  const clear = ratings.filter((r) => r.clear === true).length;
  return { status: clear >= PO_MIN_CLEAR ? 'MET' : 'NOT MET', detail: `${clear} of ${PO_SAMPLE.length} rated clear (need ${PO_MIN_CLEAR}); rated run: ${data.ratedRun || 'not stated'}`, ratings, resultsAvailable: results.length };
}

function poReview(results) {
  const lines = ['# Product Owner review (SC-005)', '', 'Rate each output: is it clear enough to support a retrospective follow-up?',
    'Record your ratings in evals/po-ratings.json (see the example at the end), commit, and run the harness again.', ''];
  for (const id of PO_SAMPLE) {
    const c = results.find((r) => r.id === id);
    lines.push(`## ${id} – ${c ? c.title : 'not evaluated'}`, '');
    if (!c || !c.output) { lines.push(`No output (${c ? c.outcome : 'not run'}).`, ''); continue; }
    lines.push('Themes:', ...c.output.themes.map((t) => `- ${t.name} (comments ${t.commentIds.join(', ')})`), '');
    lines.push('Action items:', ...c.output.actionItems.map((a) => `- [${a.owner}] ${a.action} (comments ${a.commentIds.join(', ')})`), '');
  }
  lines.push('## Example evals/po-ratings.json', '', '```json', JSON.stringify({ ratedRun: 'run-NNN-label', ratedBy: 'Product Owner',
    ratings: PO_SAMPLE.map((id) => ({ caseId: id, clear: true, note: '' })) }, null, 2), '```', '');
  return lines.join('\n');
}

function feedback(runId, gates, results, decision) {
  const lines = [`# Harness feedback – ${runId}`, '', `Overall: **${decision}**`, '',
    'Give this file to the coding agent. Fix the application code or prompt (src/). Do not edit evals/ or .harness/,',
    'do not remove cases, change expected results, lower thresholds or weaken guardrails.', ''];
  const failedGates = gates.filter((g) => !g.pass);
  if (failedGates.length) {
    lines.push('## Failed code gates', '');
    for (const g of failedGates) lines.push(`### ${g.name} (${g.requirement})`, `Expected: ${g.expected}`, '```', g.observed, '```', '');
  }
  const failed = results.filter((c) => !c.pass);
  if (failed.length) lines.push('## Failed or service-failed cases', '');
  for (const c of failed) {
    lines.push(`### ${c.id} – ${c.title} (${c.outcome}${c.safety ? ', SAFETY CASE' : ''})`, `Requirements: ${(c.requirements || []).join(', ')}`, '');
    lines.push('Failed checks:', ...failedChecks(c).map((f) => `- ${f}`), '');
    lines.push('Generated output:', '```json', c.output ? JSON.stringify(c.output, null, 2) : (c.stdout || '(none)').slice(0, 3000), '```', '');
  }
  return lines.join('\n');
}

// ---------------- main ----------------
function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const { id: runId, dir } = nextRunDir();
  fs.mkdirSync(path.join(dir, 'gates'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'cases'), { recursive: true });
  const mask = maskWords(dataset);
  const commit = run('git', ['rev-parse', '--short', 'HEAD']).stdout.trim();
  console.log(`Part 1B evaluation harness – ${runId} (commit ${commit}, dataset v${dataset.datasetVersion})\n`);

  const gates = [];
  if (!SKIP_GATES) {
    gates.push(gateIntegrity());
    gates.push(gateCommand('lint', ['run', 'lint'], 'Constitution IX', 'npm run lint exits 0 (0 errors)'));
    gates.push(gateCommand('security', ['run', 'security'], 'Constitution VI, IX', 'npm run security exits 0 (0 errors)'));
    gates.push(gateCommand('audit', ['audit', '--audit-level=high'], 'Constitution IX', '0 high/critical vulnerabilities'));
    gates.push(gateCommand('unit-tests', ['test'], 'FR-011, Constitution V', 'all unit tests pass (fake AI client, no network)'));
    gates.push(gateBuiltinsOnly());
    gates.push(gateTraceability(dataset));
    for (const g of gates) {
      fs.writeFileSync(path.join(dir, 'gates', `${g.name}.txt`), `${g.name}: ${g.pass ? 'PASS' : 'FAIL'}\nRequirement: ${g.requirement}\nExpected: ${g.expected}\nObserved:\n${g.observed}\n`);
      console.log(`  gate ${g.name.padEnd(13)} ${g.pass ? 'PASS' : 'FAIL'}`);
    }
    console.log('');
  }

  const cases = dataset.cases.filter((c) => !ONLY || ONLY.includes(c.id));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-eval-'));
  const results = [];
  cases.forEach((testCase, i) => {
    if (i > 0 && !testCase.expected.noAiCall) sleepMs(DELAY_MS);
    const c = evaluateCase(testCase, tmpDir);
    results.push(c);
    const l1 = c.layer1 ? (c.layer1.pass ? 'PASS' : 'FAIL') : '-';
    const l2 = c.layer2 ? (c.layer2.pass ? 'PASS' : 'FAIL') : '-';
    const l3 = c.layer3 ? c.layer3.score.toFixed(2) : '-';
    console.log(`  ${c.id} ${c.outcome.padEnd(15)} L1 ${l1.padEnd(4)} L2 ${l2.padEnd(4)} L3 ${l3.padEnd(4)} ${c.safety ? '[safety] ' : ''}${c.title}`);
    fs.writeFileSync(path.join(dir, 'cases', `${c.id}.json`), mask(JSON.stringify({ ...c, layer1: c.layer1 && { pass: c.layer1.pass, checks: c.layer1.checks } }, null, 2)));
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const passed = results.filter((c) => c.pass).length;
  const serviceFailures = results.filter((c) => c.outcome === 'SERVICE_FAILURE').length;
  const safety = results.filter((c) => c.safety);
  const safetyPassed = safety.filter((c) => c.pass).length;
  const gatesPass = gates.every((g) => g.pass);
  let decision;
  if (SKIP_GATES || ONLY) decision = 'PARTIAL';
  else if (serviceFailures > MAX_SERVICE_FAILURES) decision = 'INCONCLUSIVE';
  else if (gatesPass && passed >= OVERALL_MIN_PASS && safetyPassed === safety.length) decision = 'PASS';
  else decision = 'FAIL';

  const firstOutput = results.find((c) => c.output);
  const sc005 = poTally(results);
  const summary = {
    run: runId, label: LABEL, date: new Date().toISOString(), commit, node: process.version,
    configuration: { model: firstOutput ? firstOutput.output.meta.model : 'unknown', temperature: firstOutput ? firstOutput.output.meta.temperature : null,
      promptVersion: firstOutput ? firstOutput.output.meta.promptVersion : null, datasetVersion: dataset.datasetVersion, delayMs: DELAY_MS },
    thresholds: { casePass: `L1 pass + L2 pass + L3 >= ${CASE_THRESHOLD}`, overall: `>= ${OVERALL_MIN_PASS} of 15 and all safety cases`, inconclusive: `> ${MAX_SERVICE_FAILURES} service failures` },
    gates: gates.map((g) => ({ name: g.name, pass: g.pass })),
    cases: results.map((c) => ({ id: c.id, outcome: c.outcome, safety: c.safety, layer1: c.layer1 ? c.layer1.pass : null,
      layer2: c.layer2 ? c.layer2.pass : null, quality: c.layer3 ? c.layer3.score : null, ms: c.ms })),
    totals: { evaluated: results.length, passed, failed: results.length - passed - serviceFailures, serviceFailures, safetyPassed: `${safetyPassed}/${safety.length}` },
    sc005: { status: sc005.status, detail: sc005.detail },
    decision
  };
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(EVIDENCE, 'eval-results.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(dir, 'po-review.md'), poReview(results));
  if (decision !== 'PASS') fs.writeFileSync(path.join(dir, 'feedback.md'), mask(feedback(runId, gates, results, decision)));

  const table = path.join(EVIDENCE, 'eval-results.md');
  if (!fs.existsSync(table)) {
    fs.writeFileSync(table, '# Evaluation results (generated by .harness/run-evals.js – do not edit)\n\n| Run | Date | Commit | Model | Gates | Passed | Failed | Service failures | Safety | SC-005 | Decision |\n|---|---|---|---|---|---|---|---|---|---|---|\n');
  }
  fs.appendFileSync(table, `| ${runId} | ${summary.date.slice(0, 16).replace('T', ' ')} | ${commit} | ${summary.configuration.model} | ${SKIP_GATES ? 'skipped' : gatesPass ? 'PASS' : 'FAIL'} | ${passed}/${results.length} | ${summary.totals.failed} | ${serviceFailures} | ${summary.totals.safetyPassed} | ${sc005.status} | ${decision} |\n`);

  console.log(`\n  Passed ${passed}/${results.length} · service failures ${serviceFailures} · safety ${safetyPassed}/${safety.length} · gates ${SKIP_GATES ? 'skipped' : gatesPass ? 'PASS' : 'FAIL'}`);
  console.log(`  SC-005 (Product Owner ratings): ${sc005.status} – ${sc005.detail}`);
  console.log(`\n  OVERALL: ${decision}`);
  console.log(`  Evidence: ${path.relative(ROOT, dir)}${decision !== 'PASS' ? ' (see feedback.md)' : ''}`);
  process.exitCode = { PASS: 0, FAIL: 1, INCONCLUSIVE: 2, PARTIAL: 3 }[decision];
}

main();
