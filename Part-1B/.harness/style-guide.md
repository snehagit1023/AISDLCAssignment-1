# JavaScript Style Guide (Part 1B – Retro Feedback Assistant)
1. CommonJS modules (require / module.exports). Node.js 20+. Plain JavaScript, no TypeScript.
2. Runtime code uses only Node.js built-in modules; AI calls use the built-in fetch. Dev tools (ESLint and plugins) are devDependencies only.
3. Keep responsibilities in separate modules under src/: input reading and validation, redaction, prompt building, AI client, response validation, and the command line (src/cli.js). The CLI only wires modules together.
4. The AI client is passed in (dependency injection) so tests can use a fake client. Only one module may call fetch.
5. Small functions with descriptive names; const by default, let only when reassigned; no var.
6. Every exported function has a one-line comment naming the requirement it implements, e.g. // FR-003.
7. Errors: input errors print a message starting "Error:" to stderr and exit 1; AI service errors print "Error: AI service unavailable" or "Error: AI service returned invalid output" and exit 2. Never print a stack trace.
8. Secrets: GEMINI_API_KEY is read only from the environment (a local .env may load it). Never print, log, or write the key, the request headers or the full request URL containing the key.
9. The prompt text and its promptVersion live in one module; the prompt marks comments as untrusted data, not instructions.
