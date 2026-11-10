---

description: "Dependency-ordered implementation tasks for the sprint calculator"
---

# Tasks: Sprint Capacity & Velocity Calculator

**Input**: Design documents from `specs/001-sprint-capacity-velocity/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/command.md`

**Tests**: Required by the feature specification and project constitution. Use Node.js `node:test` and `node:assert/strict`; each test name must start with the FR/NFR identifier it verifies. Each validation rule requires a failure-case test.

**Organization**: Tasks are grouped by user story. Every task description identifies the FR/NFR requirement(s) it delivers or verifies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks that can be performed in parallel because they use different files and have no unfinished prerequisites.
- **[Story]**: User-story tasks are labeled `[US1]`, `[US2]`, or `[US3]`; setup, foundational, and polish tasks have no story label.
- Every task names its requirement ID(s) and the exact file path(s) it changes.

## Path Conventions

This is a single Node.js project rooted at `Part1A`. Source files are in `src/`, tests in `tests/`, examples in `examples/`, and feature design documents in `specs/001-sprint-capacity-velocity/`.

## Phase 1: Setup

**Purpose**: Establish test-first project configuration and required quality tooling.

- [ ] T001 Add an automated test named with `NFR-001` in `tests/traceability.test.js` that checks Node.js 20+ support, CommonJS, CLI-only scope, and absence of runtime dependencies beyond built-ins.
- [ ] T002 Create `package.json` for `NFR-001` and `NFR-004` with a Node.js 20+ engine constraint, CommonJS configuration, `npm test` running `node --test tests/`, and development-only ESLint/security dependencies.
- [ ] T003 Create `eslint.config.js` for `NFR-002` using ESLint and `eslint-plugin-security`, with lint and security scripts in `package.json` and no disabled security rules.
- [ ] T004 [P] Create `.gitignore` for `NFR-002` that excludes `node_modules/` and `.env` without ignoring source, tests, or example JSON files.

---

## Phase 2: Foundational

**Purpose**: Add cross-cutting traceability checks and test support required by every story.

- [ ] T005 Add an automated test named with `NFR-002` in `tests/traceability.test.js` that checks source for network calls, execution of input contents, secrets, API keys, and machine-specific paths, and ensure the `npm run security` gate is used.
- [ ] T006 Add an automated test named with `NFR-004` in `tests/traceability.test.js` that verifies every FR/NFR has an ID-prefixed automated test and every validation rule has a failure-case test.
- [ ] T007 Add an automated test named with `NFR-005` in `tests/traceability.test.js` that verifies implementation comments in `src/calculator.js` and `src/cli.js` contain the IDs for each implemented functional requirement.
- [ ] T008 Create `tests/helpers.js` for `FR-001`, `FR-016`, `FR-017`, and `NFR-004`, providing built-in-only helpers to create temporary JSON inputs, invoke `src/cli.js`, capture exit/stdout/stderr, and clean up temporary test data.

**Checkpoint**: Project configuration and shared test support are ready. Keep `.harness/` unchanged.

---

## Phase 3: User Story 1 - Assess a Sprint Plan (Priority: P1) — MVP

**Goal**: Accept a valid sprint input, calculate capacity, velocity, forecast, and verdict, and print the exact readable report.

**Independent Test**: Run `node src/cli.js report examples/worked-example.json` and verify all six output lines and worked-example values. Also verify the no-history case succeeds while retaining capacity figures.

### Tests for User Story 1

- [ ] T009 [P] [US1] Create `examples/worked-example.json` for `FR-002` through `FR-007` with the specified 10-day sprint, four members, `[18, 22, 26, 24]` history, and 25 planned points.
- [ ] T010 [P] [US1] Create `examples/no-history.json` for `FR-008` with valid capacity inputs, an empty `pastVelocities` array, and valid planned points.
- [ ] T011 [US1] Add a CLI test named with `FR-001` in `tests/cli.test.js` that accepts `report <file>` and `report <file> --json` with valid input.
- [ ] T012 [US1] Add a calculator test named with `FR-002` in `tests/calculator.test.js` that accepts the complete sprint shape, preserves oldest-first history semantics, and applies omitted `leaveDays: 0` and `allocation: 1.0` defaults.
- [ ] T013 [US1] Add calculator boundary tests named with `FR-003` in `tests/calculator.test.js` for summed full capacity and exact half-up one-decimal ties, including 1.25 reporting as 1.3.
- [ ] T014 [US1] Add calculator boundary tests named with `FR-004` in `tests/calculator.test.js` for available-capacity calculation and exact half-up one-decimal ties.
- [ ] T015 [US1] Add calculator tests named with `FR-005` in `tests/calculator.test.js` for one- and two-value histories, newest-three selection, and half-up velocity display rounding.
- [ ] T016 [US1] Add calculator tests named with `FR-006` in `tests/calculator.test.js` proving forecast uses the unrounded selected-history mean and floors fractional results, including the `[0, 0, 10]` mean/forecast example.
- [ ] T017 [US1] Add calculator tests named with `FR-007` in `tests/calculator.test.js` for `OVER_COMMITTED`, `FITS`, and `UNDER_COMMITTED`, their differences, the inclusive 80% boundary, forecast equality, and zero-forecast behavior.
- [ ] T018 [US1] Add calculator and CLI tests named with `FR-008` in `tests/calculator.test.js` and `tests/cli.test.js` confirming successful `NO_HISTORY`, populated capacities, null JSON history values, `N/A` text values, and exit code 0.
- [ ] T019 [US1] Add a CLI test named with `FR-009` in `tests/cli.test.js` asserting exactly six readable lines, exact labels/order, one-decimal display, and the worked-example verdict wording.
- [ ] T020 [US1] Add a CLI performance test named with `NFR-003` in `tests/cli.test.js` that invokes a valid 50-member report and asserts completion in under 1,000 ms, excluding fixture creation from the measured interval.

### Implementation for User Story 1

- [ ] T021 [US1] Implement valid-input normalization and omitted member defaults in `src/calculator.js` for `FR-002`, with an implementation comment containing `FR-002`.
- [ ] T022 [US1] Implement aggregate full-capacity calculation and exact half-up one-decimal rounding in `src/calculator.js` for `FR-003`, with an implementation comment containing `FR-003`.
- [ ] T023 [US1] Implement aggregate available-capacity calculation and exact half-up one-decimal rounding in `src/calculator.js` for `FR-004`, with an implementation comment containing `FR-004`.
- [ ] T024 [US1] Implement newest-three-or-fewer history selection, mean calculation, and half-up displayed velocity rounding in `src/calculator.js` for `FR-005`, with an implementation comment containing `FR-005`.
- [ ] T025 [US1] Implement capacity-adjusted forecast using the unrounded mean and floor rule in `src/calculator.js` for `FR-006`, with an implementation comment containing `FR-006`.
- [ ] T026 [US1] Implement verdict thresholds, zero-forecast handling, and difference values in `src/calculator.js` for `FR-007`, with an implementation comment containing `FR-007`.
- [ ] T027 [US1] Implement successful empty-history results with null history figures in `src/calculator.js` for `FR-008`, with an implementation comment containing `FR-008`.
- [ ] T028 [US1] Implement `report <file>` parsing, file reading, and the exact six-line readable renderer in `src/cli.js` for `FR-001` and `FR-009`, with implementation comments containing both IDs.

**Checkpoint**: The P1 readable report is independently usable with the worked and no-history examples.

---

## Phase 4: User Story 2 - Use a Machine-Readable Result (Priority: P2)

**Goal**: Provide a stable JSON output mode for downstream workflows.

**Independent Test**: Run the same valid input twice with `--json`; parse stdout as one object and verify exactly the seven specified keys in order, values, and byte-for-byte repeatability.

### Tests for User Story 2

- [ ] T029 [US2] Add a CLI test named with `FR-010` in `tests/cli.test.js` asserting JSON stdout contains only the seven specified keys in order, with correct numeric precision and JSON nulls for unavailable history values.
- [ ] T030 [US2] Add a CLI test named with `FR-018` in `tests/cli.test.js` asserting identical input contents and mode produce byte-for-byte identical output over repeated invocations.

### Implementation for User Story 2

- [ ] T031 [US2] Implement the `--json` renderer in `src/cli.js` for `FR-010`, serializing only the seven contract keys in their specified order, writing no explanatory stdout, and adding an `FR-010` implementation comment.
- [ ] T032 [US2] Ensure calculation and serialization ordering remain deterministic in `src/calculator.js` and `src/cli.js` for `FR-018`, with an implementation comment containing `FR-018`.

**Checkpoint**: JSON mode is independently consumable and deterministic.

---

## Phase 5: User Story 3 - Correct Invalid Input (Priority: P3)

**Goal**: Reject malformed sprint data, invalid arguments, and file errors with actionable messages and no partial report or stack trace.

**Independent Test**: For each validation rule and file/argument error, invoke the CLI and verify exit code 1, empty stdout, an `Error:` stderr message identifying the field or file, and no stack trace. Verify the exact missing-file and invalid-JSON messages.

### Tests for User Story 3

- [ ] T033 [P] [US3] Create representative invalid-input fixtures under `examples/` for `FR-011` through `FR-016`: `invalid-sprint-length.json`, `invalid-team.json`, `invalid-member-name.json`, `invalid-duplicate-names.json`, `invalid-leave-days.json`, `invalid-allocation.json`, `invalid-past-velocities.json`, `invalid-planned-points.json`, `invalid-required-field.json`, and malformed `invalid-json.json`.
- [ ] T034 [US3] Add CLI failure tests named with `FR-011` in `tests/cli.test.js` for sprint lengths below 1, above 30, fractional, missing, and wrongly typed, plus acceptance of 1 and 30.
- [ ] T035 [US3] Add CLI failure tests named with `FR-012` in `tests/cli.test.js` for an empty team, missing/blank names, and duplicate names including case-only duplicates after trimming.
- [ ] T036 [US3] Add CLI tests named with `FR-013` in `tests/cli.test.js` for leave below zero, above sprint length, and non-numeric values, plus accepted boundaries, fractional leave, and the omitted default.
- [ ] T037 [US3] Add CLI tests named with `FR-014` in `tests/cli.test.js` for allocation below 0.1, above 1.0, and non-numeric values, plus accepted boundaries and the omitted default.
- [ ] T038 [US3] Add CLI failure tests named with `FR-015` in `tests/cli.test.js` for negative/fractional velocity and planned points, missing required fields, wrong field types, and invalid top-level, team, and history shapes.
- [ ] T039 [US3] Add CLI tests named with `FR-016` in `tests/cli.test.js` asserting missing-file and malformed-JSON cases each return code 1, empty stdout, and the exact required stderr message.
- [ ] T040 [US3] Add CLI failure tests named with `FR-017` in `tests/cli.test.js` for invalid command arguments, unreadable input paths, and invalid input data, asserting code 1, empty stdout, field/file-specific `Error:` text, and no stack trace.

### Implementation for User Story 3

- [ ] T041 [US3] Implement sprint-length integer and inclusive-range validation in `src/calculator.js` for `FR-011`, preserving deterministic first-error ordering and adding an `FR-011` implementation comment.
- [ ] T042 [US3] Implement non-empty team, required non-blank member names, and trimmed case-insensitive duplicate detection in `src/calculator.js` for `FR-012`, adding an `FR-012` implementation comment.
- [ ] T043 [US3] Implement finite leave validation from zero through sprint length inclusive, including valid fractions, in `src/calculator.js` for `FR-013`, adding an `FR-013` implementation comment.
- [ ] T044 [US3] Implement finite allocation validation from 0.1 through 1.0 inclusive in `src/calculator.js` for `FR-014`, adding an `FR-014` implementation comment.
- [ ] T045 [US3] Implement non-negative integer validation for velocity/planned points, required-field checks, and input-shape/type checks in `src/calculator.js` for `FR-015`, adding an `FR-015` implementation comment.
- [ ] T046 [US3] Implement missing-file and invalid-JSON handling with the exact contract messages in `src/cli.js` for `FR-016`, adding an `FR-016` implementation comment.
- [ ] T047 [US3] Implement strict argument validation and file/validation error handling in `src/cli.js` for `FR-017`, returning code 1 with empty stdout and `Error:` stderr without exposing stack traces; add an `FR-017` implementation comment.

**Checkpoint**: Invalid inputs are rejected consistently without partial results, stack traces, or ambiguity.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the full requirement set and unchanged project quality gates.

- [ ] T048 Run `npm test`, `npm run lint`, `npm run security`, and `npm audit --audit-level=high` for `NFR-001` through `NFR-005`; confirm all tests pass, the 50-member test meets `NFR-003`, lint has zero errors, security has zero high findings, audit has zero high/critical vulnerabilities, runtime dependencies are built-ins only, and no `.harness/` file changed. Use `package.json` and `.harness/` as the verification targets.

## Dependencies & Execution Order

### Story completion order

1. **Setup and Foundation (T001–T008)**: Establish test coverage and project configuration before feature code.
2. **US1 (T009–T028)**: P1 is the MVP. It implements the common calculation and readable CLI behavior.
3. **US2 (T029–T032)**: P2 adds JSON rendering on top of the US1 report and CLI.
4. **US3 (T033–T047)**: P3 completes strict input and CLI error behavior on top of the US1 calculator and CLI.
5. **Polish (T048)**: Run the unchanged quality gates after all implementation tasks.

US2 and US3 both depend on US1's calculator and CLI baseline, but neither story's behavior depends on the other; after US1, they may be developed independently if work is coordinated to avoid simultaneous edits to `src/cli.js` and `tests/cli.test.js`.

### Dependency graph

```text
T001 -> T002-T004 -> T005-T008
                         |
                         v
                 US1: T009-T028
                    /       \
                   v         v
             US2: T029-T032  US3: T033-T047
                    \         /
                     v       v
                      T048
```

### Parallel execution examples

- T002 and T004 can run in parallel because they change separate files; T003 follows T002 so it can configure the lint/security scripts and the installed development plugin without a concurrent `package.json` edit.
- T009 and T010 can be created in parallel because they are separate static JSON fixtures.
- T033 creates independent example fixtures; individual fixture files may be authored in parallel, then all US3 failure tests can use them.
- Within US1, only T009 and T010 are independent; tests in the same test files and calculator implementation tasks in `src/calculator.js` should be serialized.
- US2 has no safe intra-story parallelism because its tests and implementation both edit `tests/cli.test.js` and `src/cli.js`.
- Within US3, independent invalid example files can be created in parallel; the tests and validation changes sharing `tests/cli.test.js`, `src/calculator.js`, and `src/cli.js` should be serialized.
- After US1, US2 and US3 are functionally independent, but tasks touching the shared CLI and CLI test files must be serialized or coordinated.

## Implementation Strategy

1. **MVP first**: Complete setup/foundation and US1 (T001–T028), then verify the worked example, no-history output, and performance target.
2. **Incremental delivery**: Add stable JSON output in US2, then complete all validation and file/argument errors in US3.
3. **Test-first**: Add each requirement-specific test before or alongside its implementation; preserve requirement IDs in test names and implementation comments.
4. **Final quality gates**: Complete T048 without changing harness scripts, rules, or tests to hide failures.

## Completion Validation

- Total tasks: 48
- Task count per user story: US1 — 20; US2 — 4; US3 — 15
- Setup/foundational tasks: 8
- Polish tasks: 1
- Parallel opportunities: Separate setup configuration files (subject to serializing `package.json` edits), worked/no-history fixtures, independent invalid fixture files, and separate US2/US3 work after US1 with coordination on shared files.
- Independent test criteria: US1 verifies worked-example calculations and exact six-line readable output plus empty-history handling; US2 verifies the exact seven-key JSON object and byte-for-byte repeatability; US3 verifies every validation/file/argument failure contract.
- Suggested MVP scope: Setup and foundational tasks plus US1 (P1).
- Format validation: All task rows use the checkbox, sequential `T###` ID, optional `[P]`, required user-story label only in story phases, and an exact file path; every task description names at least one FR/NFR ID.
