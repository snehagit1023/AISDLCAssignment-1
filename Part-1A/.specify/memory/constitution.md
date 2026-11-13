<!--
Sync Impact Report
Version change: unratified template -> 1.0.0
Modified principles: none; the prior document contained template placeholders only.
Added principles: I. Specification First; II. Deterministic and Exact;
  III. Simplicity; IV. Traceability; V. Test-Backed;
  VI. Clear Errors; VII. Security; VIII. Quality Gates;
  IX. Harness Independence.
Added sections: Technical and Security Constraints;
  Quality Gates and Delivery Workflow.
Removed sections: none.
Follow-up TODOs: none.
-->

# Sprint Capacity & Velocity Calculator Constitution

## Core Principles

### I. Specification First
Implementation MUST follow an approved feature specification, plan, and task list, in that
order. Acceptance criteria MUST NOT be weakened, and tests MUST NOT be deleted or loosened
to obtain a passing result. Any requirement change MUST first be made in the specification
and recorded before implementation proceeds. A change is compliant only when its approved
artifacts identify the affected requirements and tasks.

### II. Deterministic and Exact
For identical input file contents, the tool MUST produce byte-for-byte identical output.
Output ordering and formatting MUST be stable and MUST NOT depend on time, randomness, or
machine-specific settings. Capacity and velocity MUST be rounded to one decimal place;
forecasts MUST be rounded down to a whole number. Automated tests MUST assert these
precision rules, including values that exercise rounding boundaries.

### III. Simplicity
The tool MUST run on Node.js 20 or later, use plain JavaScript with CommonJS modules, and
provide a command-line interface only. It MUST NOT include a graphical user interface or
database, and its runtime dependencies MUST be limited to Node.js built-ins. Compliance is
measured by the runtime dependency tree containing no third-party packages.

### IV. Traceability
Every functional requirement MUST have a unique `FR-001`-style identifier. Every automated
test name MUST start with the identifier of the requirement it verifies, and the code
implementing each requirement MUST include that identifier in a comment. A change is
traceable only when every functional requirement can be followed from its specification
through its test and implementation.

### V. Test-Backed
Every functional requirement MUST have at least one automated test run with Node.js's
built-in `node:test` runner. Every input validation rule MUST have at least one automated
failure-case test. Tests MUST verify the specified behavior rather than merely execute the
code; compliance requires every test to pass.

### VI. Clear Errors
Invalid input MUST cause exit code 1 and an error message on stderr beginning exactly with
`Error:` and naming the invalid field. Bad input MUST NOT produce a stack trace. Automated
tests MUST check the exit code, stderr prefix, field name, and absence of a stack trace for
each validation rule's failure case.

### VII. Security
The tool MUST NOT contain secrets, API keys, or machine-specific paths, and MUST make no
network calls. Input files MUST be read as data and MUST never be executed. Compliance
requires source review and automated security scanning to find zero high-severity
findings.

### VIII. Quality Gates
A change is complete only when lint reports zero errors, the security scan reports zero
high findings, `npm audit` reports zero high or critical vulnerabilities, and 100% of
automated tests pass. The project harness MUST report `PASS` for every required gate;
otherwise the change is not done.

### IX. Harness Independence
Coding agents MUST NOT modify harness scripts, gate definitions, or their rules to obtain
a passing result. A gate change requires an approved specification change and review
independent of the implementation it evaluates. Compliance is measured by reviewing the
change set and confirming that harness code and rules were not altered to bypass a gate.

## Technical and Security Constraints

The supported runtime is Node.js 20 or later. Source code MUST use CommonJS JavaScript;
the command-line interface is the only user interface. Runtime functionality MUST use
Node.js built-ins only. Input files are untrusted data: the program may read them but MUST
not execute their contents. No network access, credentials, secrets, database, or
machine-specific paths are permitted.

## Quality Gates and Delivery Workflow

The required completion gates are: zero lint errors; zero high findings from the security
scan; zero high or critical vulnerabilities reported by `npm audit`; 100% passing
automated tests; and a harness `PASS` for all required gates. Each functional requirement
must be covered by at least one `node:test` test whose name starts with its `FR-` ID.
Each validation rule must additionally have a failure-case test. Requirement IDs must
appear in comments at their implementation sites.

Before coding, the approved specification, plan, and tasks must be present. Requirement
changes must be recorded in the specification before dependent plan, task, test, or code
changes. Reviews must verify requirement-to-test-to-code traceability, exact rounding and
determinism, error behavior, and that harness rules remain unchanged.

## Governance

This constitution governs development of the Sprint Capacity & Velocity Calculator.
Amendments MUST be proposed in this file and approved by the project owner before they
take effect. Each amendment MUST record its rationale, update the version and amendment
date, and identify any affected specifications, plans, tasks, or tests. Changes to
functional behavior MUST also follow the specification-first process.

The constitution uses semantic versioning: MAJOR for backward-incompatible governance
changes, MINOR for new principles or materially expanded requirements, and PATCH for
clarifications or non-semantic wording changes. Every implementation review MUST verify
compliance with all applicable principles and quality gates. A failed gate blocks
completion; the gate or acceptance criteria MUST NOT be weakened to secure approval.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
