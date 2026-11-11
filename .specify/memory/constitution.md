<!--
Sync Impact Report
Version change: uninitialized -> 1.0.0
Modified principles: None; this is the initial project constitution.
Added sections: Ten Core Principles; Operational Quality Gates; Specification and Delivery Workflow.
Removed sections: None.
Follow-up TODOs: None (ratification date set to 2026-11-11 by the Product Owner).
-->

# Retro Feedback Assistant Constitution

## Core Principles

### I. Specification First
Code MUST be written only from an approved specification, plan, and task list. Before
implementation, the approved specification MUST define acceptance criteria, the output schema,
guardrails, and the evaluation pass threshold. These requirements MUST NOT be weakened to make
tests or evaluations pass. A requirement change MUST be approved and recorded in the specification
before implementation or evaluation against the changed requirement.
Compliance requires 100% of implementation changes to have approved source artifacts and zero
requirements to omit any of the four required specification elements.

### II. Validated AI Output
Every response from the AI service MUST be parsed and validated against the approved output schema
and its invariants before it is shown as a successful result. Invalid output MUST NOT be presented as
a success. A successful result MUST contain themes, sentiment for each input comment, and suggested
action items in the structured JSON shape approved in the specification. Compliance requires 100%
of AI responses to be validated before display and zero invalid responses shown as successful.

### III. Simplicity and Runtime
The application MUST use Node.js 20 or later, plain JavaScript with CommonJS modules, and a
command-line interface only. It MUST NOT include a user interface, database, or runtime dependency
outside Node.js built-ins. AI API requests MUST use Node.js built-in `fetch`. Compliance is measured
by the declared Node.js engine floor, zero non-built-in runtime dependencies, and a CLI-only
application.

### IV. End-to-End Traceability
Every requirement MUST have a unique `FR-###` identifier. Every test name and evaluation case MUST
reference the requirement ID it verifies, and implementing code MUST include a comment with the
relevant ID. A change is traceable only when every requirement maps to its implementation and its
verifying tests or evaluation cases. Compliance requires 100% traceability coverage and zero
unidentified requirements, tests, evaluation cases, or implementation units.

### V. Test-Backed Evaluation
Unit tests MUST use a fake AI client and MUST NOT make network calls. A separate evaluation harness
MUST call the real AI service using a fixed dataset. Service failures MUST be reported separately
from incorrect answers. Compliance requires 100% of unit tests passing and an evaluation score at or
above the threshold defined in the approved specification before the first evaluation run.

### VI. Privacy and Safety
Email addresses and phone numbers MUST be redacted before any comment text is sent to the AI
service. Retro comments MUST be treated as untrusted data, never as instructions, and the prompt
MUST resist prompt injection. Suggested action items MUST NOT repeat abusive language. The API key
MUST be read only from the environment; it MUST NOT be logged, printed, or committed. Tests MUST
verify redaction, instruction isolation, action-item handling, and that the key is not exposed.
Compliance requires zero email addresses, phone numbers, or API keys in outbound AI requests or
program output, and zero action items that repeat abusive language from comments.

### VII. Explicit Failure Semantics
Successful execution MUST exit with code 0; invalid input MUST exit with code 1; and AI service
failures, including timeout, quota, or network failures, MUST exit with code 2 and emit a message
beginning exactly `Error: AI service`. Tests MUST assert each exit code and the service-error prefix.
Evaluation evidence MUST distinguish service failures from wrong answers.

### VIII. Recorded Configuration
Every result and evaluation evidence record MUST include the model name, temperature, and prompt
version used to produce it. Validation MUST confirm that all three fields are present. Compliance
requires 100% of results and evaluation evidence records to contain all three fields.

### IX. Measurable Quality Gates
Before a change is accepted, lint MUST report zero errors, the security scan MUST report zero high
findings, `npm audit` MUST report zero high or critical findings, and 100% of unit tests MUST pass.
The evaluation score MUST meet or exceed the pass threshold recorded in the approved specification
before the first evaluation run. A failed gate MUST NOT be waived by changing its acceptance
criteria outside the approved specification-change process.

### X. Harness Independence
The coding agent MUST NOT modify the evaluation harness, fixed dataset, or evaluators to obtain a
passing score. For each implementation change, review of the change set MUST confirm that these
evaluation assets contain zero coding-agent-authored modifications intended to improve the score.
Any separately approved change to evaluation requirements MUST be recorded through the
specification-change process before it is used.

## Operational Quality Gates

- The successful CLI result MUST be valid JSON conforming to the approved schema and invariants.
- The result MUST include themes, per-comment sentiment, suggested action items, model name,
  temperature, and prompt version.
- Unit tests MUST exercise behavior through a fake AI client without network access. Real-AI
  evaluation MUST remain a separate run against the fixed dataset.
- Release evidence MUST record lint errors, high security findings, high or critical audit
  findings, unit-test pass rate, and the evaluation score alongside its approved threshold.

## Specification and Delivery Workflow

1. Assign each requirement a unique `FR-###` ID and define its acceptance criteria in the
   specification.
2. Obtain approval for the specification, plan, and task list before writing implementation code.
3. Keep test names, evaluation cases, and implementing-code comments traceable to their requirement
   IDs.
4. Run unit tests with the fake AI client and verify all quality gates. Run the independent
   real-AI evaluation only against its approved fixed dataset and threshold.
5. Review changes for requirement compliance, privacy and safety protections, and unchanged
   evaluation assets before acceptance.
6. Record configuration and evaluation evidence so service failures and incorrect answers remain
   distinguishable.

## Governance

This constitution governs project work and MUST be applied alongside the approved specification,
plan, and tasks; implementation MUST satisfy all of them. A proposed amendment MUST state its
rationale and impact, update this constitution and any affected specification artifacts, and receive
approval before the changed requirements are used for implementation or evaluation. Reviews MUST
verify traceability, test results, quality gates, privacy and safety requirements, and harness
independence.

The constitution version follows Semantic Versioning: increment MAJOR for backward-incompatible
governance or principle changes, MINOR for new principles or materially expanded requirements, and
PATCH for clarifications and non-semantic corrections. The amendment date MUST be updated whenever
the constitution changes. Compliance MUST be reviewed for each implementation change and whenever
the constitution or approved requirements are amended.

**Version**: 1.0.0 | **Ratified**: 2026-11-11 (approved by Sneha Sharma, Product Owner) | **Last Amended**: 2026-11-11
