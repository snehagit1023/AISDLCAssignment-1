# CLI Contract

**Traceability**: FR-001–FR-011, FR-014

## Invocation

```text
node src/cli.js analyze <file>
```

The named file is UTF-8 text with one retrospective comment per line. Blank lines
are ignored; remaining comments are trimmed and assigned consecutive IDs in file
order. Limits and redaction behavior are defined in
[data-model.md](../data-model.md).

## Standard output on success

Print exactly one JSON object followed by a newline, with no other stdout content.
The object has exactly these top-level keys and types:

```json
{
  "status": "OK",
  "comments": [{ "id": 1, "text": "redacted comment" }],
  "themes": [{ "name": "theme", "commentIds": [1] }],
  "sentiment": [{ "commentId": 1, "label": "neutral" }],
  "actionItems": [{ "action": "Discuss the feedback at the next retro.", "owner": "TEAM", "commentIds": [1] }],
  "clarification": null,
  "meta": { "model": "gemini-3.8-flash", "temperature": 0.2, "promptVersion": "v1" }
}
```

The example illustrates shape only; counts, values, and cross-field rules must
satisfy the specification. An empty or entirely blank file returns a
`NEEDS_CLARIFICATION` object with empty analysis arrays without an AI request.
Irrelevant nonempty comments also yield the clarification shape.

## Errors and exit codes

| Condition | stdout | stderr | Exit |
|---|---|---|---:|
| Success, including empty input | One JSON object | Empty | 0 |
| Invalid input or missing key for nonempty input | Empty | Message beginning `Error:` | 1 |
| Gemini transport/service failure after retry | Empty | Message beginning `Error: AI service unavailable` | 2 |
| Invalid AI output after retry | Empty | `Error: AI service returned invalid output` | 2 |

Never print a stack trace, API key, authorization header, full secret-bearing
configuration, or request URL containing a key.

## Configuration and provider boundary

- `GEMINI_API_KEY` is read from the environment; optional local `.env` values do
  not override existing environment variables.
- `GEMINI_MODEL` overrides the default `gemini-3.8-flash`.
- Metadata reports temperature `0.2` and prompt version `v1`. Gemini 3.8 Flash
  ignores custom temperature values; the request omits that parameter.
- Gemini is called only by `src/ai-client.js` using built-in `fetch`, the
  `generateContent` REST API, and the key in `x-goog-api-key`.
- Unit tests use an injected fake client and must make no network calls.
