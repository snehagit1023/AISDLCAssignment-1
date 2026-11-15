# Harness Log – Part 1A: Sprint Capacity & Velocity Calculator

> Structure and fact tables prepared with AI help (Claude). Narrative answers are my own (Sneha Sharma), AI only fixed spelling and grammar.

## 1. Initial coding-agent generation and its context

**Facts**

| What | In plain words |
|---|---|
| Who wrote the code | GitHub Copilot, the AI coding assistant in VS Code (Agent mode; it picked the model gpt-6-luna by itself) |
| What I asked it to do | Build the app by running the Spec Kit command `/speckit-implement`, which works through tasks T001 to T048 from my task list |
| What it read before coding | My project rules (constitution, version 1.0.0), the approved specification (18 functional and 5 non-functional requirements), the plan, the task list, and my two harness rule files (style guide and harness rules) |
| Where the proof is saved | The AI's first version of the code is in `evidence/initial-generation/initial-code.zip`; its full work log is in `agent-summary.md`; the exact prompts I used is in `prompts.md` (Step 7) |
| How it went | 23 of its 24 tests passed. The one that failed was the speed test (NFR-003): a report for 50 team members took 1,277 milliseconds, but the limit is 1,000 milliseconds (1 second) |

Copilot followed the spec because we gave it the constitution to follow. In agent-summary.md we can see it read all the files: constitution.md, spec.md, plan.md, tasks.md, style-guide.md and harness-rules.md. By this we can see that it followed them.

## 2. The harness

**Facts:** one command, `node .harness/run-harness.js --label <name>`, written separately from the coding agent  and committed before running.

| # | Gate | Checks | Linked to |
|---|---|---|---|
| 1 | harness-integrity | `.harness/` unchanged | Constitution IX |
| 2 | lint | `npm run lint`, 0 errors | Constitution VIII |
| 3 | security | `npm run security` (eslint-plugin-security), 0 errors | Constitution VII, NFR-002 |
| 4 | audit | `npm audit --audit-level=high`, 0 high/critical | Constitution VIII |
| 5 | unit-tests | agent's 24 `node:test` tests all pass | NFR-004 |
| 6 | contract | 14 harness-owned checks from spec acceptance criteria | AC-003 … AC-018 |
| 7 | traceability | every FR/NFR in spec.md starts a test name | Constitution IV, NFR-004 |

On FAIL the harness writes `feedback.md` (failed gate, command, expected, observed, failing test details) for the coding agent.

A separate harness is important to have a human overview and review, instead of only trusting Copilot's own test cases. It is a form of human intervention.

## 3. Harness executions and outcomes

| Run | Label | Date | Commit | All 7 gates | NFR-003 time |
|---|---|---|---|---|---|
| (agent) | during /speckit-implement | 10 Nov 2026 | – | tests 23/24 | 1,277 ms ❌ |
| 1 | initial | 10 Nov 2026 | 7f79241 | PASS | 904 ms ✅ |
| 2 | rerun-2 | 10 Nov 2026 | 7f79241 | PASS | 895 ms ✅ |
| 3 | rerun-3 | 10 Nov 2026 | 7f79241 | PASS | 882 ms ✅ |
| 4 | video-demo (screen recorder running) | 11 Nov 2026 | 9f5b3cc | **FAIL** (unit-tests) | 1,339 ms ❌ |
| 5 | repair-1 (after diagnosis, recorder off) | 11 Nov 2026 | c0802c1 | PASS | 895 ms ✅ |
| 6 | video-demo-2 (screen recorder running) | 11 Nov 2026 | 48fa85b | **FAIL** (unit-tests) | 1,189 ms ❌ |

Full results: evidence/harness-results.md and evidence/harness-runs/.

We ran the harness 3 times to be sure of the result, because during implementation Copilot had one failure, which could be because of the speed of the system.

## 4. Failures encountered and evidence

**Facts**
- NFR-003 failed once during implementation (1,277 ms). A Node.js no-op process alone took about 1,736 ms at that time.
- Same unchanged test passed in harness runs 1–3 (verified identical to initial-code.zip).
- The agent kept the assertion unchanged (did not weaken the test).
- Earlier in the SDD flow: /speckit-analyze found 2 CRITICAL, 1 HIGH, 1 LOW issues; fixed through spec/plan/tasks; re-run showed 0 CRITICAL.
- During implement the agent's own traceability test failed (missing FR comments) and the agent fixed the code itself.

The cause was the environment (option 4 of the four causes: unclear spec, technology, AI hallucination, environment): on my laptop, Node.js alone took 1,736 ms to start, so the failure was not because of the code.

## 5. Repair and re-execution

**Facts**
- No code repair after the harness: no harness gate failed, and changing code or loosening the test would have been a manufactured fix.
- Documentation changes: plan.md amended on 11 Nov (test command `node --test tests/` → `node --test`, which the agent had changed without updating the plan); tasks T048–T049 marked done after the harness runs and a source review of src/ (searched http, fetch, eval, password, apikey: no results).
- Final version: evidence/final-generation/final-code.zip (identical code to initial).

I did not ask Copilot to change any code, because all three harness runs passed and the handout says not to manufacture a failure.

## 5b. Repair cycle 1 – harness run 4 failure (added 11 Nov)

**Facts**
- Run 4 failed the unit-tests gate: NFR-003 took 1,339 ms (limit 1,000 ms) while a screen recorder was running. The harness wrote evidence/harness-runs/run-004-video-demo/feedback.md.
- Step 1 – feedback to the agent: Copilot was given feedback.md and asked for the root cause and repair options that do not weaken the requirement (reply: evidence/repair-1-analysis.md).
- Step 2 – measurement by the agent, no files changed (evidence/repair-1-measurements.md): empty Node start 853–1,013 ms (first cold start 2,824 ms); full 50-member CLI run 832–859 ms, average 845 ms, 5/5 under 1,000 ms.
- Copilot's conclusion: Node startup dominates; the app's own work is small; a code optimisation would not fix failures caused by slow Node startup; changing the measurement scope would weaken the requirement.
- Step 3 – re-run of the same unchanged harness: run 5 PASS (895 ms).
- No code, test, spec or harness change was made in this cycle.
- Run 6 (11 Nov, during the second screen recording) failed the same way: NFR-003 1,189 ms. This confirms the same environment limitation.

There was a failure in harness run 4, and it was recorded in the feedback.md file. We gave it to Copilot to analyse the failure and its root cause, and to give me suggestions or options to repair it.

No code changes were required, because the delay happened during screen recording: Node took more time to start, as Windows might have been prioritising the screen recorder. We did not change the rule, but we have taken it as a limitation: when Windows is busy, there might be failures because of this delay.

The repair cycle diagnosed the problem but did not repair any code, because the cause is not in the code. The rule and the test were not weakened, and the risk still remains, so it is recorded as a limitation.

## 6. Human review and final decision

**Decision:** ACCEPT

**Justification:**

I would accept this app, because it enables me to calculate capacity, velocity and the sprint verdict dynamically for any valid sprint file. All 7 harness gates passed in runs 1–3 and again in run 5 after the repair cycle, and I checked it myself with my own Sprint_01.json, where the result was correct.

**Known limitations and residual risks:**

* The speed test (NFR-003) passes only just (~900 ms vs 1,000 ms limit), so it can fail on a slower or busy laptop, as seen in runs 4, 6 and 7 during screen recording (1,339 / 1,189 / 1,158 ms).
- It was only tested on my laptop.

**What I would add before using this in a higher-risk setting:**

- Run the harness automatically on every change (for example with GitHub Actions).
- Have another person review the code before release.
