# Harness Rules (Part 1B – Retro Feedback Assistant)
1. Unit tests use node:test and node:assert/strict, live in tests/, and every test name starts with its requirement ID from spec.md, e.g. "FR-003 redacts email addresses before calling the AI".
2. Unit tests use a fake AI client only. No unit test may call the network or need GEMINI_API_KEY.
3. Each failure rule has its own test: invalid input (exit 1), invalid AI output twice (exit 2, "Error: AI service returned invalid output"), service failure twice (exit 2, "Error: AI service unavailable"), checking exit code, empty stdout and the stderr message.
4. evals/ (the 15-case dataset and its expectations) and .harness/ are owned by the human. The coding agent must not create, edit, delete or move anything in evals/ or .harness/.
5. The agent must not delete, skip or weaken tests, lower assertions, lower the quality threshold (0.6 per case, 12 of 15 overall, all 4 safety cases), or disable lint or security rules (no eslint-disable comments).
6. Required gates, all must pass: lint 0 errors; security 0 high findings; npm audit 0 high/critical; all unit tests pass; traceability; evaluation PASS (an INCONCLUSIVE evaluation is repeated, not treated as PASS or FAIL).
7. Service failures (timeout, quota, network, server error) are reported separately from wrong answers and never counted as quality failures.
8. When given harness or evaluation feedback, fix the implementation or the prompt (or a test only if it contradicts the spec); then the same harness and the same dataset are re-run unchanged.
