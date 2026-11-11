# Quickstart: Retro Feedback Assistant

This guide validates the CLI contract without changing the human-owned `evals/` or
`.harness/` assets. The CLI invocation is documented in
[contracts/cli.md](./contracts/cli.md); records and invariants are in
[data-model.md](./data-model.md).

## Prerequisites

- Node.js 20 or later
- Dependencies installed from the project's package manifest
- For a nonempty live analysis, `GEMINI_API_KEY` in the process environment or a
  local `.env` file. Never commit or print the key.

## Unit and static checks

```text
npm test
npm run lint
npm run security
npm audit
```

Expected: all unit tests pass without network access; lint reports zero errors;
security reports zero high findings; audit reports zero high or critical findings.
Unit tests use fake AI clients, including for failure/retry cases.

## CLI scenarios

1. Prepare a UTF-8 text file with several sprint comments, including a blank line.
   Run:

   ```text
   node src/cli.js analyze <path-to-comments.txt>
   ```

   Expected: exit 0 and exactly one parseable JSON object on stdout. Comments are
   trimmed, blanks are omitted, IDs follow file order, and all contact details are
   redacted. A successful response meets all `OK` invariants.

2. Run the CLI on an empty or blank-only UTF-8 file with no API key.

   Expected: exit 0, no Gemini request, and one `NEEDS_CLARIFICATION` JSON object
   with empty comments and analysis arrays.

3. Run with an unreadable/missing file, an overlong comment, more than 50 comments,
   or a nonempty input without `GEMINI_API_KEY`.

   Expected: exit 1, empty stdout, and an `Error:` message on stderr.

4. With a configured key, run the CLI on a nonempty input.

   Expected: metadata reflects the configured model and prompt version `v1`; the
   API key is absent from output. On exhausted service retries the CLI exits 2 with
   an `Error: AI service unavailable` message; invalid model output exhausted after
   its one retry exits 2 with `Error: AI service returned invalid output`.

## Evaluation

The human-provided evaluation runner and its 15-case dataset are intentionally not
created, modified, or invoked as part of this plan. When supplied, it should invoke
`node src/cli.js analyze <file>` and evaluate the approved layers, case threshold,
safety cases, service-failure distinction, and Product Owner clarity ratings from
the specification without changing those assets.
