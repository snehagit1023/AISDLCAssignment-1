# Quickstart: Validate the Sprint Calculator

## Prerequisites

- Node.js 20 or later and npm.
- Run commands from the Part1A project root.
- The implementation layout and input field rules are in [data-model.md](./data-model.md);
  command output and failure behavior are in [contracts/command.md](./contracts/command.md).

## Setup

After implementation dependencies are installed:

```text
npm install
```

Runtime code must still depend only on Node.js built-ins. ESLint and
`eslint-plugin-security` are development-only dependencies.

## Validate the worked example

```text
node src/cli.js report examples/worked-example.json
```

Expected output:

```text
Full capacity: 35.0 person-days
Available capacity: 33.0 person-days
Average velocity: 24.0 points
Forecast: 22 points
Planned points: 25
Verdict: OVER_COMMITTED by 3 points
```

Request machine-readable output:

```text
node src/cli.js report examples/worked-example.json --json
```

Expect one JSON object containing exactly the seven contract keys and the worked-example
values. No explanatory text is written to stdout.

## Validate empty history and error behavior

Use a valid example with an empty `pastVelocities` array and check that exit status is
zero, capacities remain populated, and the report says `NO_HISTORY` (with unavailable
history figures represented as `N/A` in text and `null` in JSON).

Try a representative invalid file such as `examples/invalid-sprint-length.json`:

```text
node src/cli.js report examples/invalid-sprint-length.json
```

Expect exit code 1, empty stdout, and an `Error:` message naming `sprintLengthDays`;
input errors must not include a stack trace. Repeat for the invalid examples to exercise
team, member, leave, allocation, history, and planned-points rules.

## Run automated checks

```text
npm test
npm run lint
npm run security
npm audit --audit-level=high
```

All tests must pass; lint must report zero errors; the security scan must report zero high
findings; audit must report zero high or critical vulnerabilities. `npm test` uses the
built-in `node:test` runner. The CLI integration suite includes a 50-member invocation
that must finish in under 1,000 ms on the designated test environment.
