# Harness feedback – run 4 (video-demo)

Result: **FAIL** · commit 9f5b3cc · 2026-11-10T21:55:46.595Z · Node v24.21.0 on win32

Fix the implementation (or a test only if it contradicts spec.md). Do NOT modify .harness/, delete or weaken tests, lower assertions, disable lint/security rules, or change acceptance criteria to obtain a PASS. A legitimate requirement change must go through spec.md and be recorded.

## Gate failed: unit-tests
- Requirement: NFR-004 (all FR/NFR tests must pass)
- Command: `C:\Program Files\nodejs\node.exe --test --test-reporter=tap tests/**/*.test.js`
- Expected: all tests pass
- Observed:
```text
tests 24, pass 23, fail 1
Failing tests:
- NFR-003 completes a 50-member report in under 1000 ms after fixture creation
```
### Failing test: NFR-003 completes a 50-member report in under 1000 ms after fixture creation
```text
---
  duration_ms: 1348.6465
  type: 'test'
  location: 'C:\\Users\\Dell\\Documents\\AISDLCAssignment\\Part1A\\tests\\cli.test.js:77:1'
  failureType: 'testCodeFailure'
  error: '50-member CLI run took 1339.3 ms'
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  actual: false
  operator: '=='
  stack: |-
    C:\Users\Dell\Documents\AISDLCAssignment\Part1A\tests\cli.test.js:91:12
    withTempInput (C:\Users\Dell\Documents\AISDLCAssignment\Part1A\tests\helpers.js:18:12)
    TestContext.<anonymous> (C:\Users\Dell\Documents\AISDLCAssignment\Part1A\tests\cli.test.js:85:3)
    Test.runInAsyncScope (node:async_hooks:227:14)
    Test.run (node:internal/test_runner/test:1402:25)
    Test.processPendingSubtests (node:internal/test_runner/test:974:18)
    Test.postRun (node:internal/test_runner/test:1542:19)
    Test.run (node:internal/test_runner/test:1467:12)
    async Test.processPendingSubtests (node:internal/test_runner/test:974:7)
  ...
# Subtest: FR-010 emits the seven JSON fields in contract order with specified values and nulls
```
