# Research: Sprint Capacity & Velocity Calculator

## Decision 1: Keep calculation and validation pure

**Decision**: Put input validation, defaults, capacity/velocity calculations, forecast,
verdict, and normalized result data in `src/calculator.js`. Keep argument parsing, file
access, rendering, and process status in `src/cli.js`.

**Rationale**: Pure calculation functions can be tested directly with `node:test`; the
CLI boundary can be independently exercised with child processes to check stdout,
stderr, and exit codes. This separation limits side effects and keeps calculations
repeatable.

**Alternatives considered**: Put all logic in the CLI; rejected because it couples
calculations to filesystem and process behavior. Add a framework or schema package;
rejected because the feature requires Node.js built-ins only at runtime and has a small
input schema.

## Decision 2: Apply explicit decimal rounding only at report boundaries

**Decision**: Sum unrounded capacity terms and calculate the velocity mean at full
available numeric precision. Use a small built-in `BigInt` decimal/rational helper for
exact half-up rounding when producing the one-decimal capacity and average-velocity
results; avoid an epsilon-based tie workaround. Calculate the forecast using the
unrounded mathematical mean, then apply floor to the forecast as specified. Keep verdict
thresholds based on integer forecast and planned points.

**Rationale**: Intermediate rounding can change a later calculation; keeping reported
precision separate preserves the specified formulas. All relevant numeric values are
non-negative. Tests must include exact half-tenth cases (such as 1.25) and forecast
fractions around integer boundaries.

**Alternatives considered**: Use the one-decimal displayed average in the forecast;
rejected because it introduces an extra rounding step not present in the forecast
formula. Round each member capacity before summing; rejected because the specification
defines rounding on the aggregate capacity result. Use `Math.round` or add
`Number.EPSILON`; simpler but less reliable for decimal tie cases.

## Decision 3: Normalize and validate once in deterministic order

**Decision**: Validate the input object and required top-level fields first, then sprint
length, team membership and member properties in roster order, velocity history values
in array order, and planned points. Stop at the first invalid field. Defaults apply only
when optional member properties are omitted; supplied invalid values are rejected.

**Rationale**: Stable validation order ensures a given malformed input produces a
repeatable, actionable first error. No schema dependency is necessary for this fixed
shape.

**Alternatives considered**: Collect multiple validation errors in one response;
rejected because the required CLI contract specifies a field-naming error but not an
aggregate format. Implicitly coerce strings or nulls; rejected because it can conceal
malformed data.

## Decision 4: Make the command contract strict and output stable

**Decision**: Accept `report <file>` and `report <file> --json`; reject other argument
shapes. Render the exact six readable lines and fixed JSON key order. Use specific
messages for missing files and invalid JSON, and a field/file-specific `Error:` message
for other user errors. Write errors to stderr, no stdout, exit 1, and never print a
stack trace for input errors.

**Rationale**: Fixed output makes human and machine usage predictable, testable, and
byte-for-byte deterministic.

**Alternatives considered**: Flexible report labels or output order; rejected by the
clarified specification. Print usage/help on malformed input; rejected where it would
violate the empty-stdout error contract.

## Decision 5: Use built-in test runner and separate development-only quality tools

**Decision**: Run all tests with `node:test` and `node:assert/strict`. Use ESLint with
`eslint-plugin-security` only as development dependencies; run npm audit and the
security scan without changing harness rules.

**Rationale**: This meets the user's tool constraints while keeping runtime dependency
surface empty. Unit coverage verifies math; CLI subprocess tests verify end-to-end
contracts and validation failures; traceability tests check ID names/comments.

**Alternatives considered**: Third-party test runners, runtime validation libraries, or
security scanners invoked as application dependencies; rejected by the Node-built-ins
runtime requirement.

## Decision 6: Use representative checked-in JSON examples

**Decision**: Keep the worked example and representative invalid inputs under
`examples/`; use temporary files only for cases that need unique paths or unreadable-file
conditions during CLI tests.

**Rationale**: Static JSON examples are reviewable data, not executable scripts, and make
the happy path and common validation failures easy to reproduce.

**Alternatives considered**: Embed all input fixtures in test source; rejected because
the requested project structure explicitly includes sample JSON files.
