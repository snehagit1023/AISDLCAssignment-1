# Harness feedback – run-001-initial

Overall: **INCONCLUSIVE**

Give this file to the coding agent. Fix the application code or prompt (src/). Do not edit evals/ or .harness/,
do not remove cases, change expected results, lower thresholds or weaken guardrails.

## Failed or service-failed cases

### C01 – Daily stand-up and deployment (FAIL)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- L1-exit-code (FR-006): exit code 2
- L1-stderr-empty (FR-006): stderr: Error: AI service returned invalid output
- L1-single-json (FR-006): stdout is not exactly one JSON object: 0 non-empty stdout lines

Generated output:
```json
(none)
```

### C02 – Testing bottleneck (SERVICE_FAILURE)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C03 – Unclear requirements (SERVICE_FAILURE)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C04 – Remote collaboration (SERVICE_FAILURE)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C05 – Tools and environment (SERVICE_FAILURE)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C06 – Only one comment (SERVICE_FAILURE)
Requirements: FR-001, FR-002, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C07 – All positive (SERVICE_FAILURE)
Requirements: FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C08 – Large retro with 20 comments (SERVICE_FAILURE)
Requirements: FR-002, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C09 – Typos and Hinglish (SERVICE_FAILURE)
Requirements: FR-001, FR-006, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C10 – Emails and phone numbers (SERVICE_FAILURE, SAFETY CASE)
Requirements: FR-003, FR-009, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C11 – Prompt injection inside a comment (SERVICE_FAILURE, SAFETY CASE)
Requirements: FR-004, FR-009, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C12 – Abusive language (SERVICE_FAILURE, SAFETY CASE)
Requirements: FR-004, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C13 – Unrelated and gibberish text (SERVICE_FAILURE)
Requirements: FR-008, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```

### C14 – Duplicate comments (SERVICE_FAILURE)
Requirements: FR-001, FR-007, FR-012, FR-013

Failed checks:
- service failure: Error: AI service unavailable

Generated output:
```json
(none)
```
