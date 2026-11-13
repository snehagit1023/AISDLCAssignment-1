# Command Contract

## Invocation

```text
node src/cli.js report <file> [--json]
```

`--json` is optional and appears after the file argument. With no flag, write the
specified readable report. With the flag, write one JSON object. No other command or
flag form is in scope.

## Input

`<file>` is a path to one UTF-8 JSON document matching [data-model.md](../data-model.md).
Input is parsed as data only and is never executed.

## Successful Output

### Readable mode

Write exactly six lines, in order:

```text
Full capacity: <one-decimal-value> person-days
Available capacity: <one-decimal-value> person-days
Average velocity: <one-decimal-value-or-N/A> points
Forecast: <whole-number-or-N/A> points
Planned points: <whole-number>
Verdict: <specified-verdict-line>
```

Verdict line forms:

- `Verdict: OVER_COMMITTED by <difference> points`
- `Verdict: FITS`
- `Verdict: UNDER_COMMITTED by <difference> points`
- `Verdict: NO_HISTORY`

With no velocity history, average velocity and forecast display as `N/A`.

### JSON mode

Write only one JSON object with exactly these keys and order:

```json
{
  "fullCapacityDays": 35.0,
  "availableCapacityDays": 33.0,
  "averageVelocity": 24.0,
  "forecastPoints": 22,
  "plannedPoints": 25,
  "verdict": "OVER_COMMITTED",
  "differencePoints": 3
}
```

No-history values for `averageVelocity`, `forecastPoints`, and `differencePoints` are
JSON `null`. Output is deterministic for identical input file contents and mode.

## Errors and Exit Status

| Condition | Exit | stdout | stderr |
|-----------|------|--------|--------|
| Successful report, including no history | 0 | Report only | Empty |
| Input validation or invalid arguments | 1 | Empty | Starts with `Error:` and names the invalid field or argument |
| Missing file | 1 | Empty | `Error: file not found: <path>` |
| Invalid JSON | 1 | Empty | `Error: invalid JSON in <path>` |
| Existing file cannot be read | 1 | Empty | Starts with `Error:` and names the file |

Input errors must not expose a stack trace. The process must not write a partial report
before validation completes.
