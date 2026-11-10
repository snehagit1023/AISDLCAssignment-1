# Implementation Plan: Sprint Capacity & Velocity Calculator

**Branch**: `001-sprint-capacity-velocity` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Approved feature specification and user-provided technical constraints.

## Summary

Build a deterministic, offline command-line calculator that validates one sprint JSON
file, computes team capacity and a capacity-adjusted velocity forecast, and reports a
verdict in either the specified six-line readable format or the exact JSON object.
Use a pure CommonJS calculation/validation module, a thin CLI responsible for arguments,
file I/O and process behavior, and built-in `node:test` tests. Runtime code uses only
Node.js built-ins; ESLint and `eslint-plugin-security` are development-only tools.

## Technical Context

**Language/Version**: Plain JavaScript, CommonJS, Node.js 20+

**Primary Dependencies**: Node.js built-ins at runtime; ESLint and `eslint-plugin-security`
as development-only dependencies

**Storage**: No persistent storage; read one JSON input file and write the report to stdout

**Testing**: `node:test` and `node:assert/strict`, run by `npm test` (`node --test tests/`)

**Target Platform**: Node.js 20+ on supported desktop operating systems

**Project Type**: Command-line application

**Performance Goals**: Complete a valid 50-member report in less than 1 second, measured
from CLI invocation through completed output on the designated test environment

**Constraints**: No runtime dependencies, network calls, UI, database, credentials,
secrets, or machine-specific paths. Read input as data only. Preserve the supplied
harness unchanged. Lint must report zero errors, the security scan zero high findings,
`npm audit` zero high/critical vulnerabilities, and all tests must pass.

**Scale/Scope**: One sprint per input; at most 50 team members for the specified
performance target. Required fields and numeric bounds follow the specification.

## Constitution Check

| Principle | Plan compliance |
|-----------|-----------------|
| I. Specification First | Implement only the approved FR/NFR and acceptance criteria; record requirement changes in the spec before plan, tasks, tests, or code are changed. |
| II. Deterministic and Exact | Stable output order; ties round half up for one-decimal reporting; forecast uses the specified floor rule. |
| III. Simplicity | Node.js 20+, plain CommonJS CLI, built-ins only at runtime, no UI or database. |
| IV. Traceability | FR identifiers appear in implementation comments and begin test names; each FR/NFR is mapped to automated coverage below. |
| V. Test-Backed | Use `node:test`; each validation rule has a failure-case CLI test checking exit code, empty stdout, and stderr. |
| VI. Clear Errors | Handle errors at CLI boundary; invalid input exits 1 with field/file-specific `Error:` stderr and no stack trace. |
| VII. Security | No network, secrets, or input execution; security lint and source review. |
| VIII. Quality Gates | Run unchanged harness gates: tests, lint, security scan, and npm audit. |
| IX. Harness Independence | Do not edit `.harness/`, its rules, or scripts to obtain a pass. |

**Pre-design gate**: PASS. Requirements and technical constraints are explicit; no
unresolved clarifications block architecture.

## Architecture

`src/calculator.js` owns pure input validation and calculation. It receives parsed data
and returns a normalized report object; it performs no file access, printing, process
termination, or network activity. Validation proceeds in a stable order: top-level
object and required fields; sprint length; team array and non-empty membership; each
member's name and uniqueness; each member's leave and allocation; velocity array and
values; planned points. Stop on the first invalid field, with a field-naming validation
error. Apply defaults only to omitted optional member properties.

After validation, calculate capacities from unrounded member terms, then round the
aggregate capacity results and displayed mean velocity to one decimal using the agreed
half-up rule. Use a small built-in `BigInt` decimal/rational helper for exact half-up
rounding at these display boundaries rather than a floating-point epsilon workaround.
Use the unrounded mathematical mean of the selected history for the forecast calculation;
do not use its rounded display value. Floor the forecast to an integer.
Use forecast and integer planned points for verdict selection, with the inclusive lower
boundary `plannedPoints >= forecastPoints * 0.8`; special-case forecast zero so zero
planned points fits and positive planned points are over-committed. These decisions keep
display rounding from changing the forecast or verdict.

`src/cli.js` parses exactly `report <file> [--json]`, reads and parses the file, calls the
calculator, renders either the six fixed readable lines or the seven-key ordered JSON
object, and controls stdout, stderr, and exit status. It catches expected input,
argument, file, and JSON errors at the boundary; errors produce no stdout or stack trace.
Unexpected internal failures are not disguised as successful reports.

## Project Structure

### Documentation (this feature)

```text
specs/001-sprint-capacity-velocity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── command.md
└── tasks.md              # Created by /speckit-tasks, not by this plan
```

### Source Code (repository root)

```text
src/
├── calculator.js         # Pure validation, calculations, verdict and result values
└── cli.js                # Argument parsing, file I/O, formatting and process status

tests/
├── calculator.test.js    # Formula, normalization, rounding and verdict tests
├── cli.test.js           # CLI output, input failure, and 50-member performance tests
└── traceability.test.js  # FR/NFR test-name and implementation-comment checks

examples/
├── worked-example.json
└── invalid-*.json        # Representative invalid data files for CLI scenarios

.harness/
├── harness-rules.md      # Read-only gate requirements
└── style-guide.md        # Read-only style requirements

package.json              # npm test, lint, and security scripts; dev tools only
```

The implementation must not modify existing harness files.

**Structure Decision**: One Node.js CLI project with two source modules and focused
`node:test` files. Keep the calculator pure so the math and validation can be tested
without filesystem or process state. Exercise file and exit behavior through the actual
CLI in child processes. Keep sample inputs as static JSON data.

## Data and Validation Design

The input contract has four required top-level properties: sprint length, non-empty team,
historical velocity array, and planned points. Team-member leave and allocation are
optional and default to 0 and 1.0 respectively. See [data-model.md](./data-model.md) for
field types, limits, and error mapping.

Validation is fail-fast and deterministic in the order listed in Architecture. Reject
wrong shapes, missing required values, non-finite numeric values, and invalid bounds
before calculations. Duplicate names are compared after trimming and case-folding.
Errors identify the invalid field; missing files and malformed JSON use the exact
messages specified in FR-016. The CLI writes nothing to stdout on failure.

## Test Strategy and Requirement Traceability

Use `node:test` with `node:assert/strict`; `npm test` runs `node --test tests/`. All test
names start with the FR/NFR ID they verify. Each validation rule gets a CLI failure test
that verifies code 1, empty stdout, the `Error:` prefix and field/file name, and no
stack trace. Unit tests cover pure formulas and boundary values. CLI tests cover exact
readable lines, JSON keys and ordering, stable output, missing/unreadable files, invalid
JSON, and the 50-member latency target. The traceability test verifies ID-prefixed test
names and implementation comments for FRs.

| Requirement | Implementing module(s) | Test coverage |
|-------------|-----------------------|---------------|
| FR-001 | `src/cli.js` | `tests/cli.test.js` |
| FR-002 | `src/calculator.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-003 | `src/calculator.js`, `src/cli.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-004 | `src/calculator.js`, `src/cli.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-005 | `src/calculator.js`, `src/cli.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-006 | `src/calculator.js` | `tests/calculator.test.js` |
| FR-007 | `src/calculator.js`, `src/cli.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-008 | `src/calculator.js`, `src/cli.js` | `tests/calculator.test.js`, `tests/cli.test.js` |
| FR-009 | `src/cli.js` | `tests/cli.test.js` |
| FR-010 | `src/cli.js` | `tests/cli.test.js` |
| FR-011 | `src/calculator.js`, `src/cli.js` | `tests/cli.test.js` |
| FR-012 | `src/calculator.js`, `src/cli.js` | `tests/cli.test.js` |
| FR-013 | `src/calculator.js`, `src/cli.js` | `tests/cli.test.js` |
| FR-014 | `src/calculator.js`, `src/cli.js` | `tests/cli.test.js` |
| FR-015 | `src/calculator.js`, `src/cli.js` | `tests/cli.test.js` |
| FR-016 | `src/cli.js` | `tests/cli.test.js` |
| FR-017 | `src/cli.js` | `tests/cli.test.js` |
| FR-018 | `src/cli.js` | `tests/cli.test.js` |
| NFR-001 | `package.json`, project setup | `tests/traceability.test.js` and runtime/dependency gate |
| NFR-002 | `src/calculator.js`, `src/cli.js`, source tree | `tests/traceability.test.js` and ESLint security scan |
| NFR-003 | `src/cli.js` | `tests/cli.test.js` |
| NFR-004 | `tests/*.test.js` | `tests/traceability.test.js` and full `npm test` |
| NFR-005 | `src/calculator.js`, `src/cli.js` | `tests/traceability.test.js` |

The validation tests in `tests/cli.test.js` must include separate failure cases for each
rule: sprint-length bounds/type; empty team; missing/blank member name; duplicate names;
leave lower and upper bounds/type; allocation lower and upper bounds/type; negative and
fractional velocity and planned points; required fields and input shapes; missing file;
invalid JSON; unreadable file; and invalid command arguments.

## Quality Gates

Run the project harness unchanged. The completion gates are:

1. `npm test` — all `node:test` cases pass.
2. `npm run lint` — ESLint reports zero errors.
3. `npm run security` — security rules report zero high findings.
4. `npm audit --audit-level=high` — zero high or critical vulnerabilities across declared
   dependencies.
5. Confirm no `.harness/` file was modified and the 50-member test completes in less than
   1,000 ms on the designated environment.

## Constitution Check (Post-Design)

**PASS**: The proposed boundaries preserve a pure calculation core, meet the Node.js
CommonJS CLI-only constraint, keep runtime dependencies to built-ins, map each requirement
to tests, and preserve deterministic exact output/error contracts. The plan does not
weaken acceptance criteria or require harness changes. No constitution exception is
requested.

## Complexity Tracking

No constitution violations or additional projects are proposed; no complexity exception
is required.
