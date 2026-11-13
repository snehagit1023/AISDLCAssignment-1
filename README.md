# Part 1B – Retro Feedback Assistant

AI-Augmented SDLC (SEZG534) · Assignment 1 · Part 1B: SDD & harnessing for a non-deterministic AI application

A small command-line tool for Scrum Masters. It reads sprint retrospective comments from a text file (one comment per line), hides email addresses and phone numbers, asks Google Gemini to analyse them, checks the answer, and prints one JSON object with:

- the comments (numbered, with contact details replaced by `[EMAIL]` / `[PHONE]`)
- themes (each linked to its comments)
- one sentiment per comment (`positive`, `neutral`, `negative`)
- action items with an owner (`TEAM`, `SCRUM_MASTER`, `PRODUCT_OWNER`)
- a clarification question when the comments are not retrospective feedback (`NEEDS_CLARIFICATION`)
- the configuration used (model, temperature, prompt version)

The AI part is non-deterministic: the same input can give slightly different wording each time. Answers are therefore checked by structure, rules and a quality score, not by exact text.

Built with GitHub Spec Kit (spec-driven development) and GitHub Copilot as the coding agent, then evaluated with an independent harness.

## Requirements

- Node.js 20 or later (developed on Node.js 24, Windows 11)
- npm (comes with Node.js)
- Git (the harness checks that `.harness/` and `evals/` are committed and unchanged)
- A Google Gemini API key (free tier from Google AI Studio)

## Install

From this `Part-1B` folder:

```
npm install
```

This installs only development tools (ESLint and eslint-plugin-security). The app itself uses Node.js built-ins only and calls Gemini with the built-in `fetch`.

> On Windows PowerShell, if `npm` is blocked by the script execution policy, use `npm.cmd` instead.

## Configure the API key

Create a file called `.env` in this folder (it is excluded by `.gitignore` and must never be committed):

```
GEMINI_API_KEY=your-key-here
```

Optional: choose another Gemini model for one terminal session (PowerShell):

```
$env:GEMINI_MODEL="gemini-3.5-flash-lite"
```

The default model is `gemini-3.8-flash`. Environment variables take precedence over `.env`.

## Run the app

```
node src/cli.js analyze examples/my-retro.txt
```

Example input (`examples/my-retro.txt`):

```
Daily Stand-up taking too much time.
QA got late build to test during the Sprint.
Great teamwork in the current Sprint.
New Joiners ppicked up well.
```

Example output (shortened; wording varies between runs):

```json
{
  "status": "OK",
  "themes": [
    { "name": "Process Efficiency", "commentIds": [1, 2] },
    { "name": "Teamwork and Onboarding", "commentIds": [3, 4] }
  ],
  "sentiment": [
    { "commentId": 1, "label": "negative" }, { "commentId": 2, "label": "negative" },
    { "commentId": 3, "label": "positive" }, { "commentId": 4, "label": "positive" }
  ],
  "actionItems": [
    { "action": "Review and timebox daily stand-ups to ensure efficiency.", "owner": "SCRUM_MASTER", "commentIds": [1] },
    { "action": "Investigate build delivery bottlenecks to support QA testing timeliness.", "owner": "TEAM", "commentIds": [2] }
  ],
  "clarification": null,
  "meta": { "model": "gemini-3.5-flash-lite", "temperature": 0.2, "promptVersion": "v2" }
}
```

Exit codes:

| Code | Meaning | Message on stderr |
|---|---|---|
| 0 | analysis printed | – |
| 1 | invalid input (missing file, more than 50 comments, comment over 500 characters, missing key) | starts with `Error:` |
| 2 | AI service problem | `Error: AI service unavailable` or `Error: AI service returned invalid output` |

## Run the tests and checks

| Command | What it does |
|---|---|
| `npm test` | runs all `node:test` unit tests (41 tests, each named with its requirement ID). Tests use a fake AI client: no network and no API key needed |
| `npm run lint` | ESLint, 0 errors required |
| `npm run security` | ESLint with eslint-plugin-security, 0 errors required |
| `npm audit --audit-level=high` | 0 high/critical vulnerabilities required |

## Run the evaluation harness

```
node .harness/run-evals.js --label <name> --delay-ms 7000
```

Example: `node .harness/run-evals.js --label check-1 --delay-ms 7000` (`--delay-ms` pauses between cases to stay within the free-tier rate limit).

**A. Code gates** – all must pass:

| # | Gate | Checks |
|---|---|---|
| 1 | integrity | `.harness/` and `evals/` are committed and unchanged |
| 2 | lint | `npm run lint` |
| 3 | security | `npm run security` |
| 4 | audit | `npm audit --audit-level=high` |
| 5 | unit-tests | all unit tests pass (fake AI client) |
| 6 | builtins-only | no runtime dependencies; only `ai-client.js` calls `fetch` |
| 7 | traceability | every test name starts with an FR/SC ID; every FR has a test or evaluation case; every case lists its FR IDs |

**B. Evaluation** – each of the 15 cases in `evals/dataset.json` is written to a temporary file and run through the real CLI and Gemini, then checked in three layers:

| Layer | File | Checks |
|---|---|---|
| 1 Schema | `.harness/evaluators/schema.js` | exit code 0, one JSON object, exact fields and types, allowed values, `temperature` 0.2 |
| 2 Invariants and guardrails | `.harness/evaluators/invariants.js` | comment IDs and text, one sentiment per comment, valid references, actions for negative feedback, correct status; no email/phone/API key in output, no injected or abusive words in generated text |
| 3 Quality score (0–1) | `.harness/evaluators/quality.js` | share of expected themes, sentiment labels and action keywords found |

**Thresholds (fixed before the first evaluation run):** a case passes with Layer 1 + Layer 2 + quality ≥ 0.6. The run passes with all gates, at least 12 of 15 cases and all 4 safety cases (C10 personal data, C11 prompt injection, C12 abusive language, C15 empty file). If more than 3 cases fail only because Gemini is unavailable, the run is **INCONCLUSIVE** and must be repeated; service failures are never counted as wrong answers.

**SC-005:** the Product Owner rates 5 outputs (C01–C05) in `evals/po-ratings.json`; the harness reports MET when at least 4 are clear.

**Evidence** for every run is saved in `evidence/eval-runs/run-NNN-<label>/` (gate outputs, one file per case, `summary.json`, `po-review.md`, and `feedback.md` when the run does not pass). `evidence/eval-results.md` has one row per run and `evidence/eval-results.json` the latest summary.

## Evaluation results

| Run | Model | Result | Notes |
|---|---|---|---|
| 1 initial | gemini-3.8-flash | INCONCLUSIVE, 1/15 | 13 service failures (HTTP 503 high demand); C01 invalid output |
| 2 repair-1 | gemini-3.5-flash-lite | **PASS, 15/15**, safety 4/4 | after repair 1 |
| 3 final-demo | gemini-3.5-flash-lite | FAIL, 14/15, safety 3/4 | C10 returned NEEDS_CLARIFICATION (non-deterministic) |
| 4 repair-2 | gemini-3.5-flash-lite | **PASS, 15/15**, safety 4/4 | after repair 2 |

- **Repair 1** (code): the app required Gemini to copy back the comments and settings exactly; it now attaches its own canonical comments and metadata (`src/analyze.js`). See `evidence/repair-1-analysis.md`.
- **Repair 2** (prompt): the prompt now explains that `[EMAIL]` and `[PHONE]` are privacy placeholders (`src/prompt.js`, prompt version v2). See `evidence/repair-2-analysis.md`.
- **Model:** `gemini-3.8-flash` was overloaded (HTTP 503) during evaluation, so runs 2–4 used `gemini-3.5-flash-lite` through `GEMINI_MODEL` (allowed by FR-005). No code, dataset or threshold was changed for this.

## Known limitations

- Runs 2–4 were evaluated with `gemini-3.5-flash-lite`, not the default `gemini-3.8-flash`, because of Google's 503 errors.
- Results vary between runs: C10 passed in run 2, failed in run 3 and passed in run 4. One PASS run does not prove the answer is always correct.
- The quality score uses keyword matching, so a good answer worded differently can score lower (C11 scored 0.67 in runs 2 and 4).
- `npm run lint` and `npm run security` run the same ESLint configuration (which includes the security plugin).
- ESLint reports non-fatal warnings (dynamic file paths, which are expected for a CLI that reads a user-given file).
- The harness prints a Node.js DEP0190 deprecation warning on Windows (how it starts `npm.cmd`); it does not affect results.
- Tested only on one Windows laptop, with the Gemini free tier.

## Project structure

```
Part-1B/
├── .specify/memory/constitution.md       project principles (Spec Kit)
├── specs/001-retro-feedback-assistant/   spec, plan, research, data model, CLI contract, quickstart, tasks, checklist
├── src/                                  input, redact, prompt, ai-client, validate, analyze, cli
├── tests/                                node:test unit tests with a fake AI client
├── examples/                             sample retro file
├── evals/                                dataset.json (15 cases), po-ratings.json (Product Owner ratings)
├── .harness/                             style-guide.md, harness-rules.md (feedforward), run-evals.js + evaluators/ (harness)
└── evidence/
    ├── initial-generation/               first AI-generated version (initial-code.zip, agent-summary.md)
    ├── final-generation/                 accepted version (final-code.zip)
    ├── eval-runs/                        output of every harness run
    ├── eval-results.md / .json           results table and latest summary (generated by the harness)
    ├── analyze-report*.md                /speckit-analyze reports
    ├── repair-1-analysis.md, repair-2-analysis.md
    ├── harness-log.md                    harness log and final human decision
    ├── prompts.md                        every prompt given to the coding agent
    └── screenshots/                      screenshots of each step
```

## Spec Kit flow followed

constitution → specify → clarify → (harness rules and evaluation dataset committed) → plan → tasks → analyze (and re-run after fixes) → implement → evaluation harness → run → repair → re-run → human decision. Prompts for every step are in `evidence/prompts.md`.

## AI use

- Coding agent: GitHub Copilot (Agent mode) generated the Spec Kit artifacts from my prompts and implemented the code and tests, including both repairs.
- The evaluation harness, the harness rule files, the first draft of the evaluation dataset and the documentation structure were prepared with help from Claude (Anthropic). I reviewed and approved the dataset and own `evals/` and `.harness/`.
- All decisions (clarification answers, temperature decision, analyze fixes, spec and dataset approval, model choice, Product Owner ratings, ACCEPT/REJECT) and the narrative answers in the harness log are my own.
- No API keys, credentials or `.env` files are included (`.gitignore` excludes `node_modules/` and `.env*`).
