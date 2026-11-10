# Harness Log – Part 1A: Sprint Capacity & Velocity Calculator

## 1. Initial coding-agent generation and its context

**Facts**

| Item | Value |
|---|---|
| Coding agent | GitHub Copilot (Agent mode, model auto-routed to gpt-6-luna) |
| Command | `/speckit-implement`, tasks T001–T048 |
| Context given before coding | constitution.md v1.0.0, spec.md (Approved, 18 FR + 5 NFR), plan.md, tasks.md, .harness/style-guide.md, .harness/harness-rules.md |
| Evidence | evidence/initial-generation/initial-code.zip, agent-summary.md, prompts.md (Step 7) |
| Agent's own result | 23/24 tests passed; NFR-003 failed (50-member run 1,277 ms, limit 1,000 ms) |

Copilot followed the spec because we gave it the constitution to follow. In agent-summary.md we can see it read all the files: constitution.md, spec.md, plan.md, tasks.md, style-guide.md and harness-rules.md. By this we can see that it followed them.

## 2. The harness

**Facts:** one command, `node .harness/run-harness.js --label <name>

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

Full results: evidence/harness-results.md and evidence/harness-runs/.

We ran the harness 3 times to be sure of the result, because during implementation Copilot had one failure, which could be because of the speed of the system.

## 4. Failures encountered and evidence

**Facts**
- NFR-003 failed once during implementation (1,277 ms). A Node.js no-op process alone took about 1,736 ms at that time.
- Same unchanged test passed in harness runs 1–3 (verified identical to initial-code.zip).
- The agent kept the assertion unchanged (did not weaken the test).
- Earlier in the SDD flow: /speckit-analyze found 2 CRITICAL, 1 HIGH, 1 LOW issues; fixed through spec/plan/tasks; re-run showed 0 CRITICAL.
- During implement the agent's own traceability test failed (missing FR comments) and the agent fixed the code itself.

The cause was the environment on my laptop, Node.js alone took 1,736 ms to start, so the failure was not because of the code.

## 5. Repair and re-execution

**Facts**
- No code repair after the harness: no harness gate failed, and changing code or loosening the test would have been a manufactured fix.
- Documentation changes: plan.md amended on 11 Nov (test command `node --test tests/` → `node --test`, which the agent had changed without updating the plan); tasks T048–T049 marked done after the harness runs and a source review of src/ (searched http, fetch, eval, password, apikey: no results).
- Final version: evidence/final-generation/final-code.zip (identical code to initial).

I did not ask Copilot to change any code, because all three harness runs passed and the handout says not to manufacture a failure.

## 6. Human review and final decision

**Decision:** ACCEPT

**Justification:**

I would accept this app, because it enables me to calculate capacity, velocity and the sprint verdict dynamically for any valid sprint file. All 7 harness gates passed in three runs, and I checked it myself with my own Sprint_01.json, where the result was correct.

**Known limitations and residual risks:**

- The speed test (NFR-003) has only about a 10% margin, so it could fail on a slower laptop.
- npm audit found 3 moderate vulnerabilities in the development tools.
- It was only tested on my laptop.

**What I would add before using this in a higher-risk setting:**

- Run the harness automatically on every change (for example with GitHub Actions).
- Have another person review the code before release.
