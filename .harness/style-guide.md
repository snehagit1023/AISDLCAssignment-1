# JavaScript Style Guide (Part 1A)
1. CommonJS modules (require / module.exports). Node.js 20+.
2. Runtime code uses only Node.js built-in modules. Dev tools (ESLint and plugins) are devDependencies only.
3. Keep calculation logic in pure functions in src/calculator.js; file reading and printing live in src/cli.js.
4. Small functions with descriptive names; const by default, let only when reassigned; no var.
5. Every exported function has a one-line comment naming the requirement it implements, e.g. // FR-006.
6. Errors: throw a ValidationError with a message starting "Error:"; cli.js prints it to stderr and exits with code 1. Never print a stack trace for bad input.
7. No secrets, API keys, absolute paths or network calls.