# Implementation Plan: Retro Feedback Assistant

**Branch**: `001-retro-feedback-assistant` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/001-retro-feedback-assistant/spec.md`

## Summary

Build a privacy-safe CommonJS CLI that reads retrospective comments, redacts contact
details, requests JSON analysis from Gemini through Node's built-in `fetch`, validates
the complete result, and emits exactly one JSON object. Input handling, redaction,
prompt construction, provider access, validation, orchestration, and CLI wiring remain
separate modules. Unit tests use an injected fake AI client and make no network calls.
The human-owned evaluation runner and dataset are inputs to later evaluation, not
implementation deliverables.

## Technical Context

**Language/Version**: Plain JavaScript, CommonJS, Node.js 20+

**Primary Dependencies**: Node.js built-ins at runtime; Gemini `generateContent`
REST API via built-in `fetch`; ESLint and `eslint-plugin-security` as dev dependencies

**Storage**: None; read one local UTF-8 input file and optional `.env` configuration

**Testing**: `node:test` and `node:assert/strict`; fake AI client only; `npm test`,
`npm run lint`, and `npm run security`

**Target Platform**: Node.js CLI on supported Node.js platforms

**Project Type**: CLI

**Performance Goals**: Process up to 50 comments of 500 Unicode code points each;
bound each Gemini request attempt to 30 seconds

**Constraints**: Built-in-only runtime; key from `GEMINI_API_KEY` and never in URL,
logs, output, or evidence; environment values take precedence over `.env`; model
defaults to `gemini-3.8-flash`; send temperature `0.2` in `generationConfig` and
record it in metadata (Gemini 3.8 Flash ignores this deprecated sampling parameter;
an override model may support it); prompt version is `v1`; one
transport retry after 2 seconds and one retry for invalid model output; all code,
tests, and cases trace to FR identifiers; do not modify `evals/` or `.harness/`

**Scale/Scope**: Seven focused modules under `src/`, unit tests under `tests/`, CLI
contract and feature design documents; no database, UI, evaluation runner, or
evaluation dataset authoring

## Constitution Check

*Gate before Phase 0 research: PASS.*

- **I. Specification First**: PASS — this plan derives from the specified output
  contract, acceptance criteria, guardrails, and evaluation thresholds.
- **II. Validated AI Output**: PASS — every model response is parsed and validated
  before a successful result can reach stdout.
- **III. Simplicity and Runtime**: PASS — CLI-only CommonJS with Node built-ins at
  runtime and built-in `fetch`.
- **IV. End-to-End Traceability**: PASS — implementation modules, test names, and
  human-owned evaluation cases must carry applicable `FR-###` references.
- **V. Test-Backed Evaluation**: PASS — unit tests inject a fake client; service
  failures remain separate from answer quality. Evaluation assets remain human-owned.
- **VI. Privacy and Safety**: PASS — redact before requests; isolate comment data;
  validate generated output; never expose keys.
- **VII. Explicit Failure Semantics**: PASS — exit codes 0/1/2 and error prefixes
  are defined by the spec and CLI contract.
- **VIII. Recorded Configuration**: PASS — output metadata records model,
  temperature, and prompt version, including non-AI empty-input results.
- **IX. Measurable Quality Gates**: PASS — lint, security, audit, unit-test,
  traceability, and approved evaluation gates remain required; thresholds are not
  weakened.
- **X. Harness Independence**: PASS — no implementation work modifies `evals/` or
  `.harness/`; the human supplies the evaluation runner and dataset.

No constitution violations require complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-retro-feedback-assistant/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli.md
└── tasks.md             # Created in Phase 2, not by this plan
```

### Source Code (repository root)

```text
src/
├── input.js       # Read, trim, number, and validate comments (FR-001, FR-002)
├── redact.js      # Redact email addresses and phone numbers (FR-003)
├── prompt.js      # Prompt text and promptVersion; untrusted-data framing (FR-004)
├── ai-client.js   # Gemini REST request, timeout, transport retry (FR-005, FR-010)
├── validate.js    # JSON schema, privacy checks, and result invariants (FR-006–FR-009)
├── analyze.js     # Empty-input path, orchestration, invalid-output retry (FR-007–FR-010)
└── cli.js         # Env/config loading, dependency wiring, stdout/stderr, exit codes
                   # (FR-001, FR-002, FR-005–FR-011)
tests/
├── input.test.js
├── redact.test.js
├── prompt.test.js
├── ai-client.test.js
├── validate.test.js
├── analyze.test.js
└── cli.test.js
```

**Structure Decision**: Single-project CLI with responsibility-specific CommonJS
modules in `src/` and `node:test` suites in `tests/`. Every exported function and
each test name starts with its applicable requirement ID. The CLI only wires modules;
`ai-client.js` is the only module that calls `fetch`. The output contract is documented
in [contracts/cli.md](./contracts/cli.md). The human-owned evaluation runner, dataset,
and their containing directories are explicitly outside this plan's edit scope.

### Phase 0 and Phase 1 Design Decisions

- Read UTF-8 bytes and decode as UTF-8; trim each line, discard blanks, assign
  consecutive IDs, and measure the 500-character limit in Unicode code points.
- Redact contact information before prompt construction. Preserve the redacted
  canonical comment records for both validation and output.
- Ask Gemini for JSON using `generationConfig.responseMimeType: "application/json"`
  and `responseSchema`. The application validates shape, constraints,
  cross-references, privacy, and invariants regardless of provider-side structured
  output.
- The model response must conform to the full result shape. The validator checks
  that comments and metadata match canonical input/configuration rather than trusting
  model-generated copies. Invalid JSON or any failed check triggers one new analysis
  attempt; transport failures are retried once inside the AI client.
- Send `temperature: 0.2` in `generationConfig` and record it in result metadata.
  Gemini 3.8 Flash ignores this deprecated sampling parameter, but a model selected
  through `GEMINI_MODEL` may apply it. Do not silently substitute the model.
- Empty input returns the required clarification result without checking for a key or
  calling the AI. A nonempty input with a missing key is invalid input.
- `.env` support is a small built-in-only parser; inherited environment variables
  take precedence. No secret-bearing configuration, request headers, or response
  bodies are logged.
- The CLI is the only external interface in this implementation. The evaluation
  runner and the 15-case dataset are supplied and maintained by the human; their
  implementation and modifications are not planned.

## Constitution Check (Post-Design)

*Gate after Phase 1 design: PASS.*

The planned design preserves all ten principles. In particular, deterministic
validation precedes output, model configuration is recorded even when the provider
does not apply the reported temperature, transport and invalid-output retries have
separate ownership, fake-client tests avoid network access, and no agent-authored
changes are planned for human-owned evaluation assets. There are no unresolved
technical clarifications or unjustified complexity items.

## Complexity Tracking

No violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
