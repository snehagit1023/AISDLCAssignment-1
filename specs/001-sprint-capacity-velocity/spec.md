# Feature Specification: Sprint Capacity & Velocity Calculator

**Feature Branch**: Not created (no `before_specify` hook is configured)

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Build a command-line tool that tells a Scrum Master, before sprint planning, whether planned story points fit a sprint's real capacity."

## Clarifications

### Session 2026-11-08

- Q: How should capacity and average velocity be rounded when the first discarded decimal digit is exactly 5? → A: Round half up to one decimal place.
- Q: What exact labels and wording should the readable report use for each figure and its final verdict line? → A: Use the agreed six-line report format with fixed labels, order, and verdict wording.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assess a Sprint Plan (Priority: P1)

As a Scrum Master preparing sprint planning, I want to compare planned story points with a capacity-adjusted forecast so that I can tell whether the proposed work fits the team's actual availability.

**Why this priority**: This is the core value of the calculator; without the estimate and verdict, the tool does not solve the user's primary problem.

**Independent Test**: Provide a valid sprint JSON file with team availability, past velocities, and planned points; verify all reported figures and the verdict against hand-calculated results.

**Acceptance Scenarios**:

1. **Given** a 10-day sprint with Asha (2 leave days), Ben, Chitra (0.5 allocation), and Dev, past velocities `[18, 22, 26, 24]`, and 25 planned points, **When** the Scrum Master requests a report, **Then** full capacity is 35.0 person-days, available capacity is 33.0 person-days, average velocity is 24.0 points, forecast is 22 points, and the verdict is `OVER_COMMITTED` by 3 points.
2. **Given** valid history and a planned-point value exactly at 80% of the forecast, **When** a report is requested, **Then** the verdict is `FITS` and the difference is zero.
3. **Given** valid sprint data with no past velocities, **When** a report is requested, **Then** capacity is still reported, the verdict is `NO_HISTORY`, and average velocity, forecast, and difference are null in JSON output.

---

### User Story 2 - Use a Machine-Readable Result (Priority: P2)

As a Scrum Master using the results in another workflow, I want an optional JSON report with a stable set of fields so that I can consume the calculation without parsing prose.

**Why this priority**: JSON output makes the result reusable while the readable report remains the default experience.

**Independent Test**: Request a report with `--json`, parse stdout as one JSON object, and verify that it contains exactly the required keys and calculated values, with no other stdout content.

**Acceptance Scenarios**:

1. **Given** a valid sprint input, **When** the report is requested with `--json`, **Then** stdout contains only a JSON object with the seven specified keys.
2. **Given** the same valid input is submitted twice, **When** each report is requested in the same mode, **Then** the output is identical.

---

### User Story 3 - Correct Invalid Input (Priority: P3)

As a Scrum Master preparing sprint data, I want invalid files and values to produce clear errors so that I can correct the input without misreading an incomplete forecast.

**Why this priority**: Explicit validation prevents invalid data from producing misleading planning results.

**Independent Test**: Submit one invalid file or field per test and verify exit status, stdout, and the field-specific stderr message.

**Acceptance Scenarios**:

1. **Given** an invalid field value, **When** a report is requested, **Then** the process exits with code 1, stdout is empty, and stderr begins with `Error:` and names the field.
2. **Given** a nonexistent input path, **When** a report is requested, **Then** the process exits with code 1, stdout is empty, and stderr is exactly `Error: file not found: <path>` apart from a trailing newline.
3. **Given** a file that is not valid JSON, **When** a report is requested, **Then** the process exits with code 1, stdout is empty, and stderr is exactly `Error: invalid JSON in <path>` apart from a trailing newline.

### Edge Cases

- One or two historical velocity values are averaged using all available values.
- More than three historical values use only the last three, since the list is ordered oldest first.
- A forecast of zero with zero planned points yields `FITS`; any positive planned amount yields `OVER_COMMITTED`.
- A planned amount exactly equal to the forecast yields `FITS`.
- A planned amount below 80% of the forecast yields `UNDER_COMMITTED`; one exactly at 80% yields `FITS`.
- Leave days equal to sprint length are valid and give that member zero available capacity.
- Missing optional member fields use their stated defaults.
- Empty team, duplicated names, invalid numeric values, missing required fields, wrong field types, and malformed JSON are rejected without a stack trace.
- A file that exists but cannot be read is reported as a file error; no partial report is written.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST accept the invocation `report <file>` and the same invocation with an optional `--json` flag. Without the flag it MUST produce the readable report.
- **FR-002**: The input MUST describe one sprint with `sprintLengthDays`, a `team` array, a `pastVelocities` array, and `plannedPoints`. `pastVelocities` MUST be ordered oldest first. A missing `leaveDays` MUST default to 0 and a missing `allocation` MUST default to 1.0.
- **FR-003**: The tool MUST calculate full capacity as the sum of `sprintLengthDays × allocation` for every team member and report it to one decimal place in person-days, rounding ties up (for example, 1.25 to 1.3).
- **FR-004**: The tool MUST calculate available capacity as the sum of `(sprintLengthDays - leaveDays) × allocation` for every team member and report it to one decimal place in person-days, rounding ties up.
- **FR-005**: When history is present, the tool MUST calculate the mean of the most recent three past velocity values, or all values when fewer than three exist, and report it to one decimal place, rounding ties up.
- **FR-006**: When history is present, the tool MUST calculate forecast points as average velocity multiplied by available capacity divided by full capacity, rounded down to a whole number.
- **FR-007**: With history present, the tool MUST report `OVER_COMMITTED` when planned points exceed forecast points, with difference equal to planned points minus forecast points; `FITS` when planned points are between 80% of forecast and forecast inclusive, with difference zero; and `UNDER_COMMITTED` when planned points are below 80% of forecast, with difference equal to forecast minus planned points.
- **FR-008**: When `pastVelocities` is empty, the tool MUST report `NO_HISTORY`, still calculate and report capacity, and set average velocity, forecast points, and difference points to null in JSON output. In the readable report, it MUST display average velocity and forecast as `N/A` and end with `Verdict: NO_HISTORY`. Difference is represented by the verdict line and is not shown separately in readable output. The command MUST exit with code 0.
- **FR-009**: The default report MUST contain exactly these six lines in this order, substituting the calculated values: `Full capacity: <value> person-days`; `Available capacity: <value> person-days`; `Average velocity: <value> points`; `Forecast: <value> points`; `Planned points: <value>`; `Verdict: <verdict>`. Capacity and velocity MUST display one decimal place. The verdict line MUST be exactly `Verdict: OVER_COMMITTED by <difference> points`, `Verdict: FITS`, `Verdict: UNDER_COMMITTED by <difference> points`, or `Verdict: NO_HISTORY`, as applicable. For the example input, the final line MUST be `Verdict: OVER_COMMITTED by 3 points`.
- **FR-010**: With `--json`, stdout MUST contain only one JSON object with exactly these keys in this order: `fullCapacityDays`, `availableCapacityDays`, `averageVelocity`, `forecastPoints`, `plannedPoints`, `verdict`, `differencePoints`. Numeric values MUST follow the specified rounding; unavailable history values MUST be JSON null.
- **FR-011**: The tool MUST reject `sprintLengthDays` unless it is a whole number from 1 through 30 inclusive.
- **FR-012**: The tool MUST reject an empty team, a team member without a non-empty name, or duplicate member names. Names are compared case-insensitively after trimming surrounding whitespace.
- **FR-013**: The tool MUST reject `leaveDays` values below 0 or above `sprintLengthDays`. Leave days MUST be finite numbers; fractional values within the inclusive range are allowed.
- **FR-014**: The tool MUST reject `allocation` values below 0.1 or above 1.0. Allocation MUST be a finite number.
- **FR-015**: The tool MUST reject a `pastVelocities` value or `plannedPoints` that is negative or not a whole number. It MUST also reject missing required fields, wrong field types, and an invalid top-level input shape.
- **FR-016**: For a missing input file, the tool MUST exit with code 1, write nothing to stdout, and write `Error: file not found: <path>` to stderr. For invalid JSON, it MUST exit with code 1, write nothing to stdout, and write `Error: invalid JSON in <path>` to stderr.
- **FR-017**: For invalid arguments, unreadable files, or invalid input data, the tool MUST exit with code 1, write nothing to stdout, and write a stderr message beginning with `Error:` that identifies the offending field or file. It MUST NOT print a stack trace.
- **FR-018**: Identical input file contents and output mode MUST produce byte-for-byte identical output on repeated runs.

### Non-Functional Requirements

- **NFR-001**: The tool MUST run on Node.js 20 or later, use plain JavaScript with CommonJS modules, and have no runtime dependencies beyond Node.js built-ins. It MUST be command-line only, with no user interface or database.
- **NFR-002**: The tool MUST make no network calls. It MUST read input files as data and MUST NOT execute their contents. Source code MUST contain no secrets, API keys, or machine-specific paths.
- **NFR-003**: For a valid input containing 50 team members, the user MUST receive the completed report in under 1 second, measured from command invocation to completed output on the project's designated test environment.
- **NFR-004**: Every functional and non-functional requirement MUST be covered by at least one automated test whose test name begins with the requirement ID. Every validation rule MUST have at least one failure-case test.
- **NFR-005**: The implementation site for every functional requirement MUST include a code comment containing its requirement ID.

### Acceptance Criteria (Pass/Fail)

- **AC-001 (FR-001)**: PASS if `report <file>` produces the readable mode and `report <file> --json` produces the JSON mode; otherwise FAIL.
- **AC-002 (FR-002)**: PASS if a valid complete input is accepted, missing optional member values are treated as 0 and 1.0 respectively, and velocity order is interpreted oldest first; otherwise FAIL.
- **AC-003 (FR-003)**: PASS if the example input reports full capacity as exactly 35.0 person-days and a tie such as 1.25 is reported as 1.3; otherwise FAIL.
- **AC-004 (FR-004)**: PASS if the example input reports available capacity as exactly 33.0 person-days and exact half-tenth ties round up; otherwise FAIL.
- **AC-005 (FR-005)**: PASS if the example input reports 24.0, a one-value history reports that value to one decimal place, histories longer than three values use only the latest three, and exact half-tenth ties round up; otherwise FAIL.
- **AC-006 (FR-006)**: PASS if the example input forecasts 22 and a fractional forecast is rounded down, never rounded to nearest; otherwise FAIL.
- **AC-007 (FR-007)**: PASS if tests establish each of the three verdicts, including equality at the 80% threshold and at forecast, and each required difference; otherwise FAIL.
- **AC-008 (FR-008)**: PASS if empty history reports `NO_HISTORY`, preserves capacity figures, returns JSON null for average velocity, forecast, and difference, displays average velocity and forecast as `N/A` in the readable report, ends that report with `Verdict: NO_HISTORY`, and exits 0; otherwise FAIL.
- **AC-009 (FR-009)**: PASS if the default report has exactly the six specified lines with the exact labels and order, uses the specified verdict wording, and the example ends exactly with `Verdict: OVER_COMMITTED by 3 points`; otherwise FAIL.
- **AC-010 (FR-010)**: PASS if JSON mode emits a parseable JSON object with exactly the seven specified keys in order and no other stdout content; otherwise FAIL.
- **AC-011 (FR-011)**: PASS if sprint lengths 1 and 30 are accepted and values below 1, above 30, fractional, missing, or wrongly typed are rejected with exit 1, empty stdout, and a field-naming `Error:` message; otherwise FAIL.
- **AC-012 (FR-012)**: PASS if a non-empty team with distinct non-empty names is accepted and empty teams, missing/blank names, and duplicates (including case-only duplicates after trimming) are rejected with exit 1, empty stdout, and a field-naming `Error:` message; otherwise FAIL.
- **AC-013 (FR-013)**: PASS if leave values 0 and sprint length are accepted, omitted leave defaults to 0, and negative, over-length, or non-numeric values are rejected with exit 1, empty stdout, and a field-naming `Error:` message; otherwise FAIL.
- **AC-014 (FR-014)**: PASS if allocations 0.1 and 1.0 are accepted, missing allocation defaults to 1.0, and values outside the range or non-numeric values are rejected with exit 1, empty stdout, and a field-naming `Error:` message; otherwise FAIL.
- **AC-015 (FR-015)**: PASS if zero and positive whole-number velocities/planned points are accepted and negative, fractional, missing, or wrongly typed required values are rejected with exit 1, empty stdout, and a field-naming `Error:` message; otherwise FAIL.
- **AC-016 (FR-016)**: PASS if missing-file and malformed-JSON cases each return exit 1, empty stdout, and the exact specified stderr message; otherwise FAIL.
- **AC-017 (FR-017)**: PASS if invalid arguments, unreadable files, and invalid input data produce exit 1, empty stdout, a leading `Error:` message identifying the field/file, and no stack trace; otherwise FAIL.
- **AC-018 (FR-018)**: PASS if repeated runs using identical file contents and output mode produce byte-for-byte identical output; otherwise FAIL.
- **AC-019 (NFR-001)**: PASS if runtime compatibility and dependency inspection confirm the required runtime, language/module format, built-in-only runtime dependencies, and CLI-only scope; otherwise FAIL.
- **AC-020 (NFR-002)**: PASS if source review and automated checks find no network calls, executed input, secrets, API keys, or machine-specific paths; otherwise FAIL.
- **AC-021 (NFR-003)**: PASS if the 50-member performance test completes in less than 1,000 milliseconds on the designated test environment; otherwise FAIL.
- **AC-022 (NFR-004)**: PASS if each FR and NFR has at least one passing automated test whose name starts with its ID, and every validation rule has a failure-case test; otherwise FAIL.
- **AC-023 (NFR-005)**: PASS if each FR ID appears in a code comment at the site implementing that requirement; otherwise FAIL.

### Out of Scope

- Graphical or other user interface.
- Database, user accounts, or authentication.
- Multiple sprints in one input file.
- Story-level planning or allocation of points to individual stories.

### Key Entities *(include if feature involves data)*

- **Sprint Input**: One sprint's length, team roster, past velocity history, and planned story points.
- **Team Member**: A named person with optional leave days and allocation fraction.
- **Velocity History**: Ordered whole-number story-point totals from prior sprints, oldest first.
- **Sprint Report**: Full and available capacity, average velocity, forecast points, planned points, verdict, and difference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Scrum Master can obtain and identify the capacity, velocity, forecast, and verdict from the example input in one command, with every figure matching the expected values.
- **SC-002**: 100% of valid inputs produce figures that match the specified formulas and rounding rules, including histories of fewer than three and more than three values.
- **SC-003**: 100% of invalid-input test cases return exit code 1, produce no stdout, and provide the required actionable stderr message without a stack trace.
- **SC-004**: 100% of repeated requests with identical input and output mode produce byte-for-byte identical output.
- **SC-005**: A 50-member valid sprint input produces a complete report in under 1 second on the designated test environment.
- **SC-006**: A reviewer can verify that the report communicates whether planned work fits capacity and the size of any over- or under-commitment from the output alone.

## Assumptions

- The input is a UTF-8 JSON file representing exactly one sprint. All four top-level fields are required; only each member's `leaveDays` and `allocation` fields are optional.
- Required numeric fields must be JSON numbers (not numeric strings), finite, and conform to the bounds described above. Team entries must be objects and `team`/`pastVelocities` must be arrays.
- Member names are trimmed for duplicate detection and compared case-insensitively; the displayed name does not affect calculations.
- Fractional leave days are permitted because the requirement sets bounds but does not require whole-day leave.
- With no velocity history, average velocity is null because no average can be calculated; forecast and difference are also null as specified.
- `FITS` includes both threshold boundaries: planned points may equal 80% of forecast or equal forecast. If forecast and planned points are both zero, the verdict is `FITS`.
- A file that exists but cannot be read is treated as an input file error and uses a field/file-naming `Error:` message.
- Performance is measured on the project's designated test environment; test setup and input-file creation are excluded, but invocation and completed output are included.
- User stories, requirements, and acceptance criteria in this document define the requested scope; no unresolved questions remain.
