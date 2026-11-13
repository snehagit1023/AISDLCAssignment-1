# Harness Rules (Part 1A)
1. Tests use node:test and node:assert/strict, live in tests/, and every test name starts with its requirement ID from spec.md, e.g. "FR-007 planned 25 vs forecast 22 is OVER_COMMITTED by 3".
2. Tests assert exact values taken from the spec's acceptance criteria and worked example.
3. Every validation rule (FR-011 to FR-017) has its own failure test checking exit code 1, empty stdout and the stderr message.
4. The agent must not delete, skip or weaken tests, lower assertions, or edit anything in .harness/ to obtain a PASS.
5. The agent must not disable lint or security rules (no eslint-disable comments).
6. Required gates, all must pass: lint 0 errors; security 0 high findings; npm audit 0 high/critical; all tests pass.
7. When given harness failure output, fix the implementation (or the test only if the test contradicts the spec), then the same gates are re-run unchanged.