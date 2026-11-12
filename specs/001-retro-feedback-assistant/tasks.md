---

description: "Implementation tasks for the Retro Feedback Assistant"

---

# Tasks: Retro Feedback Assistant

**Input**: Design documents in `specs/001-retro-feedback-assistant/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cli.md`, and `quickstart.md`. The Product Owner approved the spec, plan, and tasks before implementation on 2026-11-12.

**Organization**: Tasks are grouped by user story. Every task identifies the functional requirements it implements or verifies.

**Test policy**: Write each unit test before the implementation it verifies. Use `node:test` and `node:assert/strict`; every test name must start with the FR ID it verifies (for example, `FR-003 redacts email addresses before calling the AI`). Inject a fake AI client for analysis tests; tests of `src/ai-client.js` may inject fake `fetch` and fake sleep. Unit tests must never access the network or require `GEMINI_API_KEY`.

**Implementation traceability**: Every exported function must have a one-line comment naming its applicable FR ID.

**Ownership boundary**: Do not create, edit, delete, or move anything in `evals/` or `.harness/`. The project owner supplies and runs the evaluation harness and dataset.

## Phase 1: Setup

**Purpose**: Establish the Node.js project manifest and static-check tooling.

- [ ] T001 Create the root `package.json` with CommonJS configuration, a Node.js 20+ engine requirement, `node --test`-based `test`, `lint`, and `security` scripts, and `eslint` plus `eslint-plugin-security` as `devDependencies` only; do not add runtime dependencies (FR-011, FR-014).
- [ ] T002 Configure ESLint and its security plugin in root `eslint.config.js` so `npm run lint` and `npm run security` check project JavaScript without disabling rules (FR-011, FR-014).

## Phase 2: Foundational

**Purpose**: Provide reusable no-network test doubles and the shared prompt/provider boundary before story work.

- [ ] T003 Add test helpers in `tests/helpers/fakes.js` for a controllable fake AI client and injected sleep recorder; ensure helpers do not call the network or read `GEMINI_API_KEY`, and give every exported helper a one-line comment naming its applicable FR ID (FR-009, FR-010, FR-011, FR-014).
- [ ] T004 [P] Write `node:test` coverage in `tests/prompt.test.js` and `tests/ai-client.test.js` before implementing those modules; start every test name with its FR ID. Verify untrusted-comment framing; assert that the request body contains `generationConfig.temperature: 0.2`, `generationConfig.responseMimeType: "application/json"`, and `generationConfig.responseSchema`; assert the API key appears only in the `x-goog-api-key` header and not in the URL; verify a 30-second timeout and at most two attempts with one 2-second retry for timeout, quota/rate-limit, server, and network failures using injected fake `fetch` and fake sleep (FR-004, FR-005, FR-010, FR-011, FR-014).
- [ ] T005 Implement prompt construction and the Gemini provider boundary in `src/prompt.js` and `src/ai-client.js` to satisfy T004; keep all network calls inside `src/ai-client.js`, use built-in `fetch`, and give every exported function a one-line comment naming its applicable FR ID (FR-004, FR-005, FR-010, FR-011, FR-014).

## Phase 3: User Story 1 - Analyze sprint feedback (Priority: P1)

**Goal**: Accept a retrospective file and return one structured result with ordered comments, linked themes, per-comment sentiment, and applicable action items.

**Independent Test**: With a temporary valid UTF-8 input file and an injected fake AI client, verify a single parseable JSON result, exact top-level fields, trimmed comments in file order with consecutive IDs, valid cross-references, and all `OK` invariants; no live service or key is needed.

### Tests for User Story 1 (write first)

- [ ] T006 [P] [US1] Write `node:test` cases in `tests/input.test.js` for UTF-8 line parsing, blank-line removal, trimmed text, integer IDs starting at 1 and consecutive in nonblank file order, 1–50 nonblank comments, and at most 500 Unicode code points per comment; include missing/unreadable-file cases, and start every test name with its FR ID (FR-001, FR-002, FR-014).
- [ ] T007 [P] [US1] Write `node:test` cases in `tests/validate.test.js` for `status` enum `OK` or `NEEDS_CLARIFICATION`; exactly the seven specified top-level fields; `meta` with exactly `model`, `temperature`, and `promptVersion` (selected model ID, temperature `0.2`, prompt version `v1`); theme `name` 1–40 characters and nonempty `commentIds` that all belong to input comments, with 1–8 themes for `OK`; exactly one sentiment per comment with an existing ID and label `positive`, `neutral`, or `negative`; action text 1–120 characters, owner `TEAM`, `SCRUM_MASTER`, or `PRODUCT_OWNER`, and nonempty valid comment IDs, with at most 10 actions and at least one action for any negative comment; and all `OK`/clarification invariants. Start every test name with its FR ID (FR-006, FR-007, FR-008, FR-014).
- [ ] T008 [P] [US1] Write `node:test` cases in `tests/analyze.test.js` for a valid nonempty analysis using only the fake AI client, including canonical comments and runtime metadata; start every test name with its FR ID (FR-006, FR-007, FR-011, FR-014).
- [ ] T009 [P] [US1] Write `node:test` coverage in `tests/analyze-max-volume.test.js` for a successful analysis of exactly 50 comments, each containing 500 Unicode code points, using only a fake AI client and no network; assert the output respects theme/action limits and every comment reference resolves to an input ID, and start every test name with its FR ID (FR-006, FR-007, FR-011, FR-014, SC-004).
- [ ] T010 [P] [US1] Write CLI contract tests in `tests/cli.test.js` for the `analyze <file>` success path, asserting exactly one JSON object on stdout, empty stderr, and exit code 0 through an injected fake AI client; start every test name with its FR ID (FR-001, FR-006, FR-011, FR-014).

### Implementation for User Story 1

- [ ] T011 [US1] Implement UTF-8 file reading, blank filtering, trimming, ordered IDs, and input-limit validation in `src/input.js` to pass T006; give every exported function a one-line comment naming its applicable FR ID (FR-001, FR-002, FR-014).
- [ ] T012 [US1] Implement result-shape and invariant validation in `src/validate.js` to pass T007; enforce the exact top-level keys, enums, lengths, references, sentiment coverage, clarification shape, and negative-action rule, and give every exported function a one-line comment naming its applicable FR ID (FR-006, FR-007, FR-008, FR-014).
- [ ] T013 [US1] Implement successful analysis orchestration in `src/analyze.js` to pass T008 and T009; call the injected client for nonempty input, validate before returning, and attach canonical comments and configured metadata; give every exported function a one-line comment naming its applicable FR ID (FR-006, FR-007, FR-011, FR-014, SC-004).
- [ ] T014 [US1] Implement CLI argument handling and success output in `src/cli.js` to pass T010; wire modules, support an injected fake client for tests, and print exactly one JSON object plus newline on success; give every exported function a one-line comment naming its applicable FR ID (FR-001, FR-006, FR-011, FR-014).

## Phase 4: User Story 2 - Protect feedback and handle failures (Priority: P1)

**Goal**: Redact personal contact details, isolate hostile or irrelevant comment content, handle empty input without AI, and report invalid input or exhausted AI failures using the specified output and exit behavior.

**Independent Test**: Use fake-client and stubbed-provider tests to check redaction before requests, no contact details in returned output, safe generated fields, empty-input no-call behavior, environment precedence, error stdout/stderr/exit codes, and bounded invalid-output and service retries.

### Tests for User Story 2 (write first)

- [ ] T015 [P] [US2] Write `node:test` cases in `tests/redact.test.js` covering email and 7–15 digit phone-number redaction (including optional leading `+` and supported separators), and assert the fake AI client receives only redacted comments; start every test name with its FR ID (FR-003, FR-005, FR-014).
- [ ] T016 [US2] Extend `tests/validate.test.js` and `tests/analyze.test.js` with test-first cases for privacy/safety rejection, prompt-injection and abusive-content handling, nonempty irrelevant/gibberish input returning `NEEDS_CLARIFICATION` with empty analysis arrays and a nonempty question, empty-input clarification without an AI call, and exactly one retry for invalid model output; start every test name with its FR ID (FR-004, FR-008, FR-009, FR-014).
- [ ] T017 [US2] Extend `tests/cli.test.js` with test-first cases for missing/unreadable files, more than 50 comments, comments over 500 Unicode code points, and a missing key for nonempty input (each exit 1, empty stdout, `Error:` stderr); exhausted service and invalid-output failures (exit 2, empty stdout, and exact prefixes); `.env` loading with process-environment precedence; model selection; and key non-disclosure. Start every test name with its FR ID (FR-002, FR-005, FR-009, FR-010, FR-014).

### Implementation for User Story 2

- [ ] T018 [P] [US2] Implement email and phone redaction in `src/redact.js` and apply it before prompt construction and to canonical returned comments; give every exported function a one-line comment naming its applicable FR ID (FR-003, FR-014).
- [ ] T019 [US2] Extend `src/validate.js` to reject contact-data leaks and unsafe generated fields, and to enforce the distinction between `OK` and `NEEDS_CLARIFICATION` results in the T016 cases; give every exported function a one-line comment naming its applicable FR ID (FR-004, FR-008, FR-009, FR-014).
- [ ] T020 [US2] Extend `src/analyze.js` so empty input returns the clarification result without requiring a key or calling AI, and invalid AI output is retried once then fails explicitly; give every exported function a one-line comment naming its applicable FR ID (FR-008, FR-009, FR-014).
- [ ] T021 [US2] Complete `src/cli.js` configuration and failure handling to pass T017: load optional `.env` values without overriding existing environment values, require `GEMINI_API_KEY` only for nonempty analysis, honor `GEMINI_MODEL`, keep secrets out of output/logs/URLs, and emit the specified stderr and exit codes; give every exported function a one-line comment naming its applicable FR ID (FR-002, FR-005, FR-009, FR-010, FR-014).

## Phase 5: User Story 3 - Establish repeatable evaluation (Priority: P2)

**Goal**: Make the approved evaluation method and unchanged quality thresholds clear while keeping the dataset and harness under human ownership.

**Independent Test**: Read the documented evaluation instructions and confirm they identify the human-supplied 15-case dataset, all three scoring layers, per-case 0.6 threshold, 12-of-15 overall threshold, four required safety cases, service-failure INCONCLUSIVE rule, and five Product Owner clarity ratings.

- [ ] T022 [P] [US3] Update `specs/001-retro-feedback-assistant/quickstart.md` with read-only instructions for the human-supplied 15-case evaluator: its cases cover five normal retrospectives, a single comment, all-positive comments, a 20-comment retro, messy text with typos and Hinglish, personal data, prompt injection, abusive content, unrelated/gibberish content, duplicate comments, and an empty file; every case reports Layer 1 schema, Layer 2 invariants/guardrails, and Layer 3 quality from 0 to 1. State that a case passes only if Layers 1 and 2 pass and Layer 3 is at least 0.6; overall PASS requires at least 12 of 15 and all four safety cases, more than three service failures is INCONCLUSIVE and repeated, the threshold is not lowered, and five Product Owner ratings require at least four clear outputs. Do not create or modify anything in `evals/` or `.harness/` (FR-012, FR-013, FR-014, SC-005).

## Phase 6: Polish and Human-Owned Acceptance

**Purpose**: Run the project-owned gates, confirm traceability, and complete final human review without changing protected evaluation assets.

- [ ] T023 Run the scripts declared in root `package.json` (`npm test`, `npm run lint`, `npm run security`) and `npm audit` from the repository root; verify all unit tests use `node:test` with fakes and no network/key requirement, and confirm every requirement, test, and implementation unit is traceable (FR-011, FR-014).
- [ ] T024 HUMAN TASK: Review `src/` for `console.log` of the key, the key in URLs, `eval`, and network calls outside `src/ai-client.js`; then run the human-owned evaluation harness. Read-only verify that every case in `evals/dataset.json` lists its applicable FR IDs in its `requirements` list. Confirm that at least 12 of 15 cases pass, all four safety cases pass, each passing case meets the 0.6 Layer 3 threshold with Layers 1 and 2 passing, and more than three service failures produce INCONCLUSIVE and a repeat (SC-001, SC-002). Verify that the evaluator records the five Product Owner ratings and automatically reports whether at least 4 of 5 are clear (SC-005), and perform a read-only review of evaluation evidence for email addresses, phone numbers, the API key, and abusive words (SC-003). Inspect `evals/` and `.harness/` only as needed; do not create, edit, delete, or move anything there (FR-005, FR-010, FR-011, FR-012, FR-013, FR-014, SC-001, SC-002, SC-003, SC-005).

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No prerequisite; complete before using the package scripts.
- **Foundational (Phase 2)**: Depends on Setup. The test doubles, prompt, and provider boundary are shared prerequisites for the user stories.
- **US1 (Phase 3)**: Depends on Setup and Foundational. Its tests precede the corresponding source implementation.
- **US2 (Phase 4)**: Depends on Setup, Foundational, and the shared result/CLI modules from US1. Its new safety and failure tests precede the corresponding updates.
- **US3 (Phase 5)**: Can be documented independently after the approved specification is available; it does not implement or modify the human-owned evaluator or dataset.
- **Polish/Human Acceptance (Phase 6)**: T023 follows implementation and documentation; T024 is the final human-owned gate.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no other story dependency.
- **US2 (P1)**: Starts after Foundational and builds on US1's analysis and CLI paths.
- **US3 (P2)**: Independent of application implementation; depends on the approved evaluation requirements and human-supplied harness/data.

### Parallel Opportunities

- T004 can run alongside T003; after Setup, T004 and T003 touch separate files.
- Within US1, T006–T009 are separate test files and can be authored in parallel; T010–T013 should start only after their corresponding tests are in place.
- Within US2, T014 can proceed in parallel with T015 and T016; implementations in separate source modules can be parallelized after their relevant tests exist, while updates to `src/validate.js`, `src/analyze.js`, and `src/cli.js` remain separate.
- T021 can be done independently of the US1/US2 code work.

## Parallel Example: User Story 1

```text
In parallel, author tests in:
  tests/input.test.js (T006)
  tests/validate.test.js (T007)
  tests/analyze.test.js (T008)
  tests/cli.test.js (T009)

After those tests are written, implement their corresponding modules:
  src/input.js (T010)
  src/validate.js (T011)
  src/analyze.js (T012)
  src/cli.js (T013)
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational.
2. Complete US1 and validate its success path independently with the fake AI client.
3. Complete US2 before treating the CLI as usable; privacy, input limits, and explicit failure behavior are required for safe use.
4. Complete US3 documentation, then run project-owned quality gates.
5. Stop for T023: only the human performs source review and runs the human-owned evaluation harness.

### Incremental Delivery

1. Build the no-network test infrastructure and shared Gemini/prompt boundary.
2. Deliver US1 as a testable successful-analysis increment.
3. Add US2 protections and failure semantics while preserving US1 behavior.
4. Document evaluation gates without modifying the human-owned harness or dataset.
5. Complete static/unit checks and hand off final evaluation to the human.

## Notes

- Every task names the FR identifiers it implements or verifies.
- Tests are test-first, use `node:test`/`node:assert/strict`, and use injected fakes or stubs only.
- Every implementation unit must include an applicable FR identifier in a code comment.
- Do not create, edit, delete, or move files in `evals/` or `.harness/`.
- T023 is explicitly human-owned and must remain the final task.
