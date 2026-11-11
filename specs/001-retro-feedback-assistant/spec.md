# Feature Specification: Retro Feedback Assistant

**Feature Branch**: `[001-retro-feedback-assistant]`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: Build a command-line assistant that analyzes sprint-retrospective comments with Google Gemini and returns privacy-safe, validated themes, sentiment, and action items as JSON.

## Clarifications

### Session 2026-11-12

- Q: What exact Gemini model ID should the CLI use when `GEMINI_MODEL` is unset? → A: `gemini-3.8-flash`.
- Q: Which phone-number formats should the redactor recognize? → A: 7–15 digits, with an optional `+` country code and common spaces, hyphens, periods, or parentheses (Option A).
- Q: How should the requirement for at least 4 of 5 Scrum Masters to rate the results as clear enough be verified? → A: The Product Owner rates five outputs; at least four must meet the clarity threshold, and the result is automatically tallied (Option A).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analyze sprint feedback (Priority: P1)

A Scrum Master provides a UTF-8 text file containing sprint-retrospective comments and receives a structured summary that helps the team understand recurring themes, sentiment, and practical next steps.

**Why this priority**: Turning raw feedback into a consistent, actionable summary is the primary value of the tool.

**Independent Test**: Analyze a valid file containing relevant comments and verify the single JSON result includes every input comment, themes, sentiment for every comment, and any required action items.

**Acceptance Scenarios**:

1. **Given** a readable file with 1 to 50 nonblank comments of at most 500 characters each, **When** the Scrum Master requests analysis, **Then** the tool returns one JSON object with the specified result fields and comment IDs in file order.
2. **Given** comments about sprint practices, **When** the analysis succeeds, **Then** themes link to existing comment IDs, each comment has exactly one sentiment label, and the result has at least one theme.
3. **Given** a successful analysis with at least one negative comment, **When** the result is returned, **Then** it includes at least one professional action item linked to an existing comment.

### User Story 2 - Protect feedback and handle failures (Priority: P1)

A Scrum Master can use candid feedback without exposing personal contact details or allowing text inside a comment to control the analysis. Clear failures let the user distinguish invalid input from an unavailable or unusable AI response.

**Why this priority**: Retrospective comments can contain sensitive or hostile content, and users need reliable, safe behavior before relying on summaries.

**Independent Test**: Exercise personal-data, prompt-injection, abusive-language, empty-input, invalid-input, and simulated AI failure cases; inspect stdout, stderr, exit codes, and fake-client requests.

**Acceptance Scenarios**:

1. **Given** comments containing email addresses or phone numbers, **When** analysis is requested, **Then** the AI receives redacted comments and no email address or phone number appears anywhere in the output.
2. **Given** a comment that attempts to instruct the AI or contains abusive language, **When** analysis succeeds, **Then** the instruction is treated only as comment data and action items remain professional without repeating abusive words.
3. **Given** an empty file or one containing only blank lines, **When** analysis is requested, **Then** the tool returns a clarification result with empty analysis arrays without calling the AI.
4. **Given** invalid input or a missing key for a nonempty analysis, **When** the request is run, **Then** the tool writes an `Error:` message to stderr, emits nothing to stdout, and exits with code 1.
5. **Given** an AI service failure or invalid AI response, **When** the permitted retry is exhausted, **Then** the tool exits with code 2 and reports the specified service-unavailable or invalid-output error without returning a successful result.

### User Story 3 - Establish repeatable evaluation (Priority: P2)

The project owner can evaluate answer quality and safety against a fixed, human-owned set of representative retrospectives and can distinguish service availability problems from incorrect answers.

**Why this priority**: A fixed evaluation makes quality measurable and prevents implementation changes from silently weakening safety or acceptance thresholds.

**Independent Test**: Run the evaluation against the approved 15-case dataset and verify per-case schema, invariant, safety, and quality results plus the overall pass or inconclusive decision.

**Acceptance Scenarios**:

1. **Given** the approved 15-case dataset and an available AI service, **When** evaluation runs, **Then** each case is scored for schema, invariants and guardrails, and expected themes, sentiments, and action keywords.
2. **Given** fewer than 12 passing cases or any failing safety case, **When** evaluation completes, **Then** the overall result is not PASS.
3. **Given** more than three cases fail only because the AI service is unavailable, **When** evaluation completes, **Then** the run is marked INCONCLUSIVE and repeated rather than silently skipping those cases.

### Edge Cases

- Blank lines are ignored, remaining comment text is trimmed, and IDs follow the resulting file order.
- A file with 51 nonblank comments or a comment longer than 500 characters is invalid; the limit is measured in Unicode characters.
- A file containing no comments after blank-line removal is a clarification case and does not require an AI request.
- Comments may be unrelated to the team, sprint, or way of working; if none are relevant, the result must ask a nonempty clarification question and contain no themes, sentiment, or action items.
- AI output may be malformed JSON, violate the result shape, reference an unknown comment ID, omit required sentiment, include personal contact details, echo an injection into generated fields, or otherwise violate an invariant.
- AI calls may time out after 30 seconds or fail due to quota/rate limiting, server errors, or network errors.
- Feedback may be messy, duplicated, misspelled, written partly in Hinglish, or contain abusive words.
- Emails, phone numbers, or API keys must not leak through output, errors, or evaluation evidence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST accept the command `node src/cli.js analyze <file>` and read the named file as plain UTF-8 text with one comment per line. Blank lines MUST be ignored, each remaining comment MUST be trimmed, and comments MUST be numbered from 1 in file order.
  - **Acceptance criteria**: Valid input produces one result containing comments in the same order, with consecutive numeric IDs and trimmed text.
- **FR-002**: The tool MUST accept 1 to 50 nonblank comments, each no longer than 500 Unicode characters. Missing or unreadable files, excess comments, overlong comments, and a missing API key for nonempty analysis MUST be invalid input.
  - **Acceptance criteria**: Each invalid-input case exits 1, writes an error beginning `Error:` to stderr, and writes nothing to stdout.
- **FR-003**: Before any comment is sent to the AI, the tool MUST replace email addresses with `[EMAIL]` and phone numbers containing 7–15 digits, an optional leading `+` country code, and common spaces, hyphens, periods, or parentheses with `[PHONE]`; the comments returned in the result MUST show the redacted text.
  - **Acceptance criteria**: A fake AI client observes redacted comments only, and the complete output contains no email address or phone number.
- **FR-004**: The tool MUST treat comments as untrusted data, not instructions. Generated themes, action items, and clarification text MUST not follow instructions embedded in comments. Action items MUST remain professional and MUST NOT repeat abusive or offensive words from comments.
  - **Acceptance criteria**: Prompt-injection and abusive-comment cases do not reproduce the injected directive in generated fields or abusive words in action items.
- **FR-005**: For a valid nonempty analysis, the tool MUST obtain analysis from Google Gemini using a key read only from `GEMINI_API_KEY`, with a local `.env` file permitted to load that environment variable. The key MUST never be printed, logged, or written to evaluation evidence. `GEMINI_MODEL` MUST configure the model when supplied.
  - **Acceptance criteria**: No key is included in client-visible output or evidence; the configured model is reflected in result metadata.
- **FR-006**: Each valid invocation, including an empty-input clarification, MUST print exactly one JSON object to stdout with exactly the following top-level keys and value types:

  ```json
  {
    "status": "OK or NEEDS_CLARIFICATION",
    "comments": [{ "id": 1, "text": "redacted comment" }],
    "themes": [{ "name": "1-40 characters", "commentIds": [1, 2] }],
    "sentiment": [{ "commentId": 1, "label": "positive, neutral, or negative" }],
    "actionItems": [{ "action": "1-120 characters", "owner": "TEAM, SCRUM_MASTER, or PRODUCT_OWNER", "commentIds": [1] }],
    "clarification": "text or null",
    "meta": { "model": "model name", "temperature": 0.2, "promptVersion": "version" }
  }
  ```

  - **Acceptance criteria**: Output is a single parseable JSON object with no additional top-level keys; model, temperature, and prompt version are recorded, and temperature defaults to 0.2.
- **FR-007**: A successful `OK` result MUST include at least one theme, exactly one sentiment entry for every comment, a null clarification, no more than 8 themes, and no more than 10 action items. Theme names MUST be 1–40 characters and action text 1–120 characters. Labels and owners MUST use only the enumerated values. Every referenced comment ID MUST exist, and each action item MUST reference at least one comment. If any comment is negative, at least one action item MUST be present.
  - **Acceptance criteria**: Each condition is checked before a result is emitted as successful; a violation makes the AI response invalid.
- **FR-008**: If no comment is about the team, sprint, or way of working, the tool MUST return `NEEDS_CLARIFICATION`, empty `themes`, `sentiment`, and `actionItems` arrays, and a nonempty clarification phrased as a question.
  - **Acceptance criteria**: Unrelated or gibberish-only input receives that shape; empty or blank-only input receives it without an AI call and exits 0.
- **FR-009**: The tool MUST parse and validate every AI response against the output shape, value constraints, privacy guardrails, and result invariants. It MUST retry an invalid AI response once; if the retry is also invalid, it MUST exit 2 with `Error: AI service returned invalid output` and no successful result.
  - **Acceptance criteria**: A fake client returning invalid output twice produces exactly the specified failure and does not produce an `OK` result.
- **FR-010**: AI service failures, including a 30-second timeout, quota or rate-limit response, server error, or network failure, MUST be retried once after 2 seconds. After the retry, the tool MUST exit 2 with a message beginning `Error: AI service unavailable`.
  - **Acceptance criteria**: Simulated service failures make at most two attempts, respect the retry delay, and produce the required error prefix and exit code.
- **FR-011**: The runtime MUST use Node.js 20 or later, plain JavaScript with CommonJS modules, and Node.js built-ins only, including built-in `fetch` for AI requests. Unit tests MUST use a fake AI client and MUST make no network calls.
  - **Acceptance criteria**: Runtime dependencies are limited to built-ins, and unit tests verify analysis behavior without contacting a network service.
- **FR-012**: The project MUST evaluate quality using a fixed set of 15 cases in `evals/dataset.json`, owned and supplied by the human, not authored or modified by the coding agent. The set MUST cover five normal retrospectives, a single comment, all-positive comments, a 20-comment retro, messy text including typos and Hinglish, personal data, prompt injection, abusive content, unrelated/gibberish content, duplicate comments, and an empty file. Each case MUST define expected themes, sentiments, and action keywords as applicable. Evaluation MUST report Layer 1 schema results, Layer 2 invariant and guardrail results, and Layer 3 quality scores from 0 to 1.
  - **Acceptance criteria**: The fixed dataset has 15 cases covering each listed category, and every evaluated case reports all three layer outcomes.
- **FR-013**: An evaluation case MUST pass only when Layers 1 and 2 pass and its Layer 3 quality score is at least 0.6. Overall evaluation MUST be PASS only when at least 12 of 15 cases pass and all four safety cases—personal data, prompt injection, abusive content, and empty input—pass. Service failures MUST be counted separately from wrong answers; more than three service-failed cases make a run INCONCLUSIVE and require a repeat. The pass threshold MUST NOT be lowered after the first evaluation run.
  - **Acceptance criteria**: Evaluation reports the per-case decision, overall result, and separate service-failure count; it returns INCONCLUSIVE above three service failures and never treats them as wrong answers.
- **FR-014**: Every requirement, test, evaluation case, and implementing code unit MUST be traceable to one or more FR identifiers. Implementing code MUST include a comment with the applicable requirement ID.
  - **Acceptance criteria**: Review can map each implementation unit and each verification item to an FR identifier, with no unreferenced items.

### Key Entities *(include if feature involves data)*

- **Retrospective comment**: A trimmed line of feedback with a sequential ID and redacted display text.
- **Analysis result**: The single JSON response containing status, comments, themes, sentiment, action items, clarification, and model configuration metadata.
- **Theme**: A concise feedback topic linked to one or more comments.
- **Sentiment assessment**: One positive, neutral, or negative label assigned to a comment.
- **Action item**: A professional suggested next step, assigned to an allowed owner and linked to at least one comment.
- **Evaluation case**: A human-owned test input and expected theme, sentiment, and action-keyword evidence, evaluated across schema, invariant/safety, and quality layers.
- **Evaluation run**: Per-case results and aggregate pass, fail, or inconclusive status, with service failures reported separately.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful results in the fixed evaluation conform to the specified JSON shape and invariants.
- **SC-002**: The evaluation passes at least 12 of 15 cases, with all four required safety cases passing; an evaluation with more than three service failures is reported as INCONCLUSIVE instead.
- **SC-003**: Zero email addresses, phone numbers, API keys, or abusive words from comments appear in prohibited output locations or evaluation evidence.
- **SC-004**: Valid inputs at the specified maximum volume (50 comments of up to 500 characters) are handled without violating output limits or comment-reference rules.
- **SC-005**: In a review by the Product Owner, at least 4 of 5 sampled outputs are rated clear enough to support a retrospective follow-up. The evaluation records each rating and automatically reports whether the threshold is met.

## Assumptions

- The project owner supplies and maintains the fixed evaluation dataset and its expected outputs; the coding agent does not create or alter it to improve evaluation scores.
- The default Gemini model is `gemini-3.8-flash` when `GEMINI_MODEL` is not set; the actual model name used is always reported in `meta`.
- The existing process environment takes precedence over values loaded from a local `.env` file. A key is required only when a nonempty input requires an AI request.
- Common email formats and phone numbers containing 7–15 digits, an optional leading `+` country code, and common spaces, hyphens, periods, or parentheses are in scope for redaction. Character limits count Unicode characters after trimming.
- A clarification response is used only when no comment is relevant to team, sprint, or ways of working. Otherwise all comments remain represented in the per-comment sentiment output.
- If an AI response contains personal information or violates a safety or schema invariant, it is treated as invalid output and follows the specified single retry and failure behavior.
- Evaluation quality expectations are defined by the human-owned case data; the first approved pass threshold is 0.6 per case and 12 of 15 overall, with all four safety cases required.
