# Research: Retro Feedback Assistant

## Gemini REST API

**Decision**: Use Google's `generateContent` REST API via Node's built-in `fetch`,
with the API key only in the `x-goog-api-key` header. Request JSON using
`generationConfig.responseMimeType: "application/json"` and
`generationConfig.responseSchema`, then parse and validate the response locally.

**Rationale**: The REST API supports the Node-built-ins-only runtime constraint and
JSON MIME mode. Provider-side JSON mode does not enforce the application's full
schema, privacy checks, or cross-field invariants. The official current model page
lists `gemini-3.8-flash` as stable and supporting structured outputs.

**Alternatives considered**: Google GenAI SDKs provide integration conveniences and
automatic retries, but add a runtime dependency outside Node.js built-ins. The newer
Interactions API is documented by Google's quickstart, but the specified
`generateContent` request format is directly supported by its REST reference.

**Decision**: Construct the documented
`/v1beta/models/{model}:generateContent` endpoint with the model in the path, JSON
request body, and `x-goog-api-key` header; never put the key in the URL or logs.
Keep the configured API key out of output and evaluation evidence.

**Rationale**: This conforms to the REST reference and the privacy requirements.
Check HTTP `response.ok` explicitly because HTTP error statuses do not necessarily
reject `fetch`. Use one bounded retry after 2 seconds for timeouts, network errors,
quota/rate responses, and server failures; do not retry permanent client errors.
Retry policy is product-defined and intentionally simpler than Google's recommended
exponential backoff with jitter.

**Alternatives considered**: Google's recommended backoff with jitter is more
adaptive, but conflicts with the specified single retry after a fixed 2-second
delay. Retrying all HTTP errors is also rejected because authentication and other
permanent client errors are not transient.

**Decision**: Include `temperature: 0.2` in `generationConfig` and record the same
value in result metadata. Continue to use the specified default model
`gemini-3.8-flash`; allow `GEMINI_MODEL` to select another model.

**Rationale**: Current Google documentation says custom temperature values are
ignored for Gemini 3.6+ and 4, including Gemini 3.8 Flash, where temperature is a
deprecated sampling parameter. Sending `0.2` preserves the requested configured
value and allows it to take effect when `GEMINI_MODEL` selects a model that supports
it. For the default model, metadata records the configured value even though the
provider ignores it.

**Alternatives considered**: Omitting temperature would prevent compatible override
models from applying the configured value. Changing the default model or the
approved spec is outside this planning scope.

References:

- [GenerateContent REST reference](https://ai.google.dev/api/generate-content/generate-content)
- [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
- [Gemini API key guidance](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini retry guidance](https://ai.google.dev/gemini-api/docs/troubleshooting#retry-strategy)
- [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting#check-api)

## Node.js Runtime, Input, and Tests

**Decision**: Use plain CommonJS, declare a Node.js 20+ engine floor, and use only
Node.js built-ins at runtime. Isolate `fetch` in `ai-client.js`, use a fresh
`AbortSignal.timeout(30_000)` per request attempt, and check HTTP status explicitly.

**Rationale**: Node 20 provides global `fetch` and `AbortSignal.timeout()`. This
meets the required runtime floor and avoids an HTTP dependency. Fetch's stability
status differed in Node 20 documentation; keep compatibility with the assignment's
floor and validate on a currently supported Node.js release as well.

**Alternatives considered**: A third-party HTTP client would provide conveniences
but violate the built-ins-only constraint. Raising the minimum Node version would
change the supplied technical context.

**Decision**: Use `node:fs/promises` to read the file and decode valid UTF-8, then
trim and filter lines before counting Unicode code points with `[...text].length`.

**Rationale**: The acceptance limit is stated in Unicode characters, while
JavaScript `String.length` counts UTF-16 code units. Counting code points supports
the expected scalar-value interpretation and avoids counting a supplementary
character twice. Use a fatal UTF-8 decoder so malformed byte sequences are rejected
as invalid input rather than silently replaced.

**Alternatives considered**: `Intl.Segmenter` counts user-perceived grapheme
clusters, which differs for combining sequences and is not specified by the
acceptance criteria. Default UTF-8 decoding may replace malformed input instead of
rejecting it.

**Decision**: Use `node:test` and `node:assert/strict`; inject the AI client into
analysis code and a sleeper into retry logic so tests can verify delays without
network requests or real waiting.

**Rationale**: This makes no-network testing enforceable, keeps transport behavior
testable, and allows explicit assertions for failure output and exit codes.

**Alternatives considered**: Node's test mocks/timers can also exercise time-based
behavior, but dependency injection keeps retry timing independent from global test
runner facilities.

**Decision**: Load optional `.env` values using a small built-in-only parser before
reading configuration; preserve pre-existing `process.env` values. Declare
CommonJS explicitly and keep ESLint/security tooling in development dependencies.

**Rationale**: This follows the supplied environment-precedence and dependency
constraints. Node's in-process environment-file APIs vary across Node 20 releases,
so a minimal parser avoids depending on a later minor version.

**Alternatives considered**: `dotenv` is a runtime dependency and therefore out of
scope. Node's `--env-file` changes the required bare CLI invocation; newer
`process.loadEnvFile()` availability cannot be assumed across the full Node 20
floor.

References:

- [Node.js CommonJS modules](https://nodejs.org/docs/latest-v20.x/api/modules.html)
- [Node.js globals: fetch and AbortSignal](https://nodejs.org/docs/latest-v20.x/api/globals.html)
- [Node.js test runner](https://nodejs.org/docs/latest-v20.x/api/test.html)
- [Node.js filesystem API](https://nodejs.org/docs/latest-v20.x/api/fs.html#fspromisesreadfilepath-options)
- [Node.js process API](https://nodejs.org/docs/latest-v20.x/api/process.html)
- [Node.js release schedule](https://github.com/nodejs/Release)
- [ESLint language options](https://eslint.org/docs/latest/use/configure/language-options)
- [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security)

## Scope and Ownership

**Decision**: Plan the CLI and its verification only; do not author the evaluation
runner or modify `evals/` or `.harness/`.

**Rationale**: The user specified that these assets are human-owned and that the
runner will be supplied by the human. The CLI must nevertheless preserve the
documented JSON contract so that runner can invoke `node src/cli.js analyze <file>`.

**Alternatives considered**: Adding a local evaluator would duplicate human-owned
work and violate the requested scope.
