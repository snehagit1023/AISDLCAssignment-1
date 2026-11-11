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

## Step 2 – specify (12 Nov)

Command: /speckit-specify  (first two attempts accidentally used /speckit-constitution because the suggestion list picked the first item; Copilot made no changes those times)

IMPORTANT: The project root is the current workspace folder C:\Users\Dell\Documents\AISDLCAssignment\Part1B. Work inside Part1B only. Never use the parent folder or Part1A.

Build a Retro Feedback Assistant: a command-line tool for Scrum Masters. It reads sprint-retrospective comments from a text file and uses an AI model (Google Gemini) to return themes, per-comment sentiment and suggested action items as structured JSON.

Input: node src/cli.js analyze <file>. The file is plain UTF-8 text with one comment per line. Blank lines are ignored and each comment is trimmed. Allowed: 1 to 50 comments, each at most 500 characters. Comments are numbered 1, 2, 3... in file order.

Output: the tool always prints one JSON object to stdout with exactly these keys: status, comments, themes, sentiment, actionItems, clarification, meta (model, temperature, promptVersion). At most 8 themes and 10 action items. [Full schema as sent: see spec.md FR-006.]

Invariants, guardrails, evaluation dataset (15 cases), 3 layers, case pass = layers 1–2 pass and quality >= 0.6, overall PASS = at least 12/15 and all 4 safety cases, service failures counted separately (>3 = INCONCLUSIVE), threshold never lowered. [Full text as sent: same content as recorded in spec.md FR-002 to FR-013.]

Non-functional: Node.js built-ins only at runtime (built-in fetch), no network calls in unit tests (fake AI client), every requirement has at least one test or evaluation case referencing its ID.

Out of scope: user interface, database, user accounts, storing history, sending results anywhere.

Write user stories with priorities, numbered functional requirements (FR-001 ...), non-functional requirements, and measurable pass/fail acceptance criteria. List assumptions and any unresolved questions.

Result: spec.md with 3 user stories, FR-001 to FR-014, 5 success criteria; checklist requirements.md.

## Step 3 – clarify (12 Nov)

Command: /speckit-clarify

IMPORTANT: Work inside C:\Users\Dell\Documents\AISDLCAssignment\Part1B only.

Review specs/001-retro-feedback-assistant/spec.md for ambiguities. Focus areas include: the default Gemini model name, which phone-number formats are redacted, and whether SC-005 (Scrum Master rating) can be verified automatically.

Copilot questions and my answers:
- Q1 Default Gemini model when GEMINI_MODEL is unset? Copilot suggested gemini-2.5-flash. I checked Google's deprecations page (updated 22 Oct 2026): 2.5 Flash is limited to earlier users; recommended for new projects is gemini-3.8-flash. My answer: gemini-3.8-flash.
- Q2 Which phone-number formats are redacted? My answer: A – 7–15 digits, optional + country code, with spaces, hyphens, periods or parentheses.
- Q3 How is SC-005 (4 of 5 Scrum Masters rate results clear) verified? Option A needed five Scrum Masters, not practical. My answer: "Product Owner reviews 5 outputs"; follow-up: A – the Product Owner rates five outputs, at least four must meet the clarity threshold (threshold kept).

Result: spec.md updated (Clarifications, FR-003, SC-005, Assumptions). Checklist 14/16: the 2 unchecked items are "no implementation details in spec" – intentional, because the assignment requires naming Node.js and Gemini in the spec.


## Step 4a – harness rules and evaluation dataset, before plan (12 Nov)

Not a Copilot prompt. Created .harness/style-guide.md, .harness/harness-rules.md and evals/dataset.json (15 cases: 5 normal, 6 special, 4 safety: C10 personal data, C11 prompt injection, C12 abusive, C15 empty). Dataset drafted with AI help (Claude), reviewed and approved by me as Product Owner (status APPROVED, approvedOn 2026-11-12). Committed before plan: "Part 1B: harness rules and approved eval dataset (before plan)".

## Step 4 – plan (12 Nov)

Command: /speckit-plan

IMPORTANT: The project root is C:\Users\Dell\Documents\AISDLCAssignment\Part1B. Never use the parent folder.

Create the implementation plan for specs/001-retro-feedback-assistant/spec.md, following .specify/memory/constitution.md, .harness/style-guide.md and .harness/harness-rules.md.

Technical context:
- Node.js 20+, plain JavaScript, CommonJS. Runtime uses Node.js built-ins only; Gemini is called with built-in fetch (Gemini generateContent REST API, API key sent in the x-goog-api-key header, never in the URL). Dev dependencies only: eslint and eslint-plugin-security.
- Default model gemini-3.8-flash (overridable by GEMINI_MODEL), temperature 0.2, promptVersion "v1". Ask Gemini for JSON output (responseMimeType application/json).
- .env loading with a small built-in parser (no dotenv package); existing environment variables take precedence.
- Modules under src/: input (read, trim, validate), redact (email/phone), prompt (prompt text + promptVersion, comments marked as untrusted data), ai-client (the only module that calls fetch; timeout 30 s, one retry after 2 s), validate (schema + invariants + privacy guardrails), analyze (orchestrates, retries invalid output once), cli.js (wiring, exit codes 0/1/2).
- The AI client is injected so unit tests use a fake client; tests use node:test and make no network calls. npm scripts: test, lint, security.
- evals/ and .harness/ already exist and are owned by the human: do not create, change or plan tasks that modify them. The evaluation runner will be provided by the human in .harness/; the plan only needs the CLI to work with node src/cli.js analyze <file>.

Do not write any application code yet.

During plan:
- Copilot asked to fetch web pages (Gemini API docs ai.google.dev, nodejs.org, raw.githubusercontent.com/nodejs/node, developer.mozilla.org, github.com/eslint-community/eslint-plugin-security). I allowed each one after checking it was official documentation.
- Copilot question "Temperature handling": research found Gemini 3.8 Flash ignores custom temperature (deprecated sampling parameter; I confirmed on Google's Gemini 3.8 Flash developer guide: "These parameters are ignored by the backend"). Copilot recommended option 1 (omit temperature from the request, keep 0.2 in metadata). I did not want that, because the metadata would say 0.2 while nothing was sent.
- Mistake: I typed my custom answer in the main chat box instead of the answer box, so option 1 was submitted and plan.md said "omit temperature … as confirmed by the user". I noticed it and sent this correction:

Correction to the temperature question: I typed my custom answer in the wrong box, so option 1 was submitted by mistake. My actual decision is:
Keep gemini-3.8-flash and keep sending temperature 0.2 in generationConfig, so the configured value is recorded honestly in meta and takes effect if GEMINI_MODEL is set to a model that supports it. Document in research.md that Gemini 3.8 Flash ignores temperature (deprecated sampling parameter, per Google docs). Use responseMimeType application/json with a responseSchema for consistent output. No spec change.
Please update plan.md (Technical Context constraints and the Phase 0/1 temperature decision, removing "omit temperature" and "as confirmed by the user") and research.md accordingly. Do not change anything else.

Result: plan.md, research.md, data-model.md, quickstart.md, contracts/cli.md (5 files, +487 −84). Constitution check PASS before and after design (10/10). 7 modules in src/, 7 test files. After correction: temperature 0.2 sent and recorded, responseSchema used, no spec change.
