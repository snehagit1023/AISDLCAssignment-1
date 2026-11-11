# Part 1B – Prompts log

## Step 1 – constitution (11 Nov)

Command: /speckit-constitution

IMPORTANT: The project root is the current workspace folder C:\Users\Dell\Documents\AISDLCAssignment\Part1B. Work inside Part1B only. Never use the parent folder or Part1A.

Establish the constitution for a Retro Feedback Assistant: a command-line tool that sends a team's sprint-retrospective comments to an AI model (Google Gemini) and returns themes, per-comment sentiment and suggested action items as structured JSON.

Principles:
1. Specification first: code is written only from the approved spec, plan and tasks. Acceptance criteria, the output schema, guardrails and the evaluation pass threshold may not be weakened to make tests or evaluations pass. Any requirement change goes through the spec and is recorded.
2. Validated AI output: every AI response is parsed and validated against the output schema and invariants before it is shown; invalid output is never shown as a successful result.
3. Simplicity: Node.js 20+, plain JavaScript (CommonJS), command-line only, no UI, no database, no runtime dependencies beyond Node.js built-ins (use built-in fetch for the AI API).
4. Traceability: every requirement has an ID (FR-001...). Every test name and evaluation case references the ID it verifies, and implementing code carries a comment with its ID.
5. Test-backed: unit tests use a fake AI client and never call the network; a separate evaluation harness calls the real AI with a fixed dataset.
6. Privacy and safety: email addresses and phone numbers are redacted before any text is sent to the AI; retro comments are treated as untrusted data, never as instructions (prompt-injection resistance); abusive language is not repeated in action items; the API key is read only from the environment, never logged, printed or committed.
7. Failure distinction: AI service failures (timeout, quota, network) exit with code 2 and a message starting "Error: AI service"; invalid input exits with code 1; success exits with code 0. Service failures are reported separately from wrong answers.
8. Recorded configuration: the model name, temperature and prompt version are recorded in every result and in evaluation evidence.
9. Quality gates (measurable): lint 0 errors, security scan 0 high findings, npm audit 0 high or critical, 100% of unit tests passing, and the evaluation score at or above the pass threshold defined in the spec before the first evaluation run.
10. Harness independence: the harness, evaluation dataset and evaluators are not modified by the coding agent to obtain a PASS.

Identify measurable quality standards for each principle.

Notes: Copilot hit a PowerShell execution-policy block on Spec Kit's resolve-template.ps1 and re-ran it with -ExecutionPolicy Bypass for that one process (I allowed once). Result: constitution v1.0.0, 10 principles. Copilot left the ratification date as TODO; I set it to 2026-11-11 as Product Owner.
