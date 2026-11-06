## Step 1 – constitution (05 Nov)
 IMPORTANT: The project root is the current workspace folder C:\Users\Dell\Documents\AISDLCAssignment\Part1A. All Spec Kit files are in Part1A.specify. Run every command and read every file inside Part1A only. Never use the parent folder C:\Users\Dell\Documents\AISDLCAssignment.

Establish the constitution for a Sprint Capacity & Velocity Calculator, a small command-line tool for Scrum teams.

Principles:

Specification first: code is written only from the approved spec, plan and tasks. Acceptance criteria may not be weakened, and tests may not be deleted or loosened to make them pass. Any requirement change goes through the spec and is recorded.
Deterministic and exact: the same input file always produces the same output. Rounding rules are explicit (capacity and velocity to 1 decimal; forecast rounded down to a whole number).
Simplicity: Node.js 20+, plain JavaScript (CommonJS), command-line only, no UI, no database, no runtime dependencies beyond Node.js built-ins.
Traceability: every functional requirement has an ID (FR-001...). Every test name starts with the ID it verifies, and the code that implements a requirement carries a comment with its ID.
Test-backed: every functional requirement has at least one automated test using the built-in node:test runner, including at least one failure case for each validation rule.
Clear errors: invalid input exits with code 1 and a message on stderr that starts with "Error:" and names the field. The tool never crashes with a stack trace on bad input.
Security: no secrets, API keys or machine-specific paths in code; no network calls; input files are read, never executed.
Quality gates (measurable): lint 0 errors, security scan 0 high findings, npm audit 0 high or critical vulnerabilities, 100% of tests passing. A change is not done until the harness reports PASS on all gates.
Harness independence: the harness scripts and their rules are not modified by the coding agent to obtain a PASS.
Identify measurable quality standards for each principle.
## Step 2 – specify (06 Nov)
MPORTANT: The project root is the current workspace folder C:\Users\Dell\Documents\AISDLCAssignment\Part1A. All Spec Kit files are in Part1A\.specify. Run every command and read every file inside Part1A only. Never use the parent folder C:\Users\Dell\Documents\AISDLCAssignment.

Build a Sprint Capacity & Velocity Calculator: a command-line tool that tells a Scrum Master, before sprint planning, whether the planned story points fit the sprint's real capacity.

Input: a JSON file passed on the command line (report <file>, optional --json flag). Example file:
{
  "sprintLengthDays": 10,
  "team": [
    {"name": "Asha", "leaveDays": 2},
    {"name": "Ben"},
    {"name": "Chitra", "allocation": 0.5},
    {"name": "Dev"}
  ],
  "pastVelocities": [18, 22, 26, 24],
  "plannedPoints": 25
}
leaveDays defaults to 0 and allocation defaults to 1.0. pastVelocities is ordered oldest first.

Calculations:
- Full capacity (person-days) = sum of sprintLengthDays x allocation. 1 decimal.
- Available capacity = sum of (sprintLengthDays - leaveDays) x allocation. 1 decimal.
- Average velocity = mean of the most recent 3 pastVelocities (all of them if fewer than 3). 1 decimal.
- Forecast = average velocity x available / full, rounded DOWN to a whole number.
- Verdict: OVER_COMMITTED if planned > forecast (difference = planned - forecast); FITS if 80% of forecast <= planned <= forecast (difference = 0); UNDER_COMMITTED if planned < 80% of forecast (difference = forecast - planned).
- If pastVelocities is empty: verdict NO_HISTORY, capacity still reported, forecast and difference null, exit code 0.

Expected result for the example: full 35.0, available 33.0, average velocity 24.0, forecast 22, verdict OVER_COMMITTED by 3 points.

Output: by default a readable report with one line per figure, ending with "Verdict: OVER_COMMITTED by 3 points". With --json, only a JSON object with exactly the keys fullCapacityDays, availableCapacityDays, averageVelocity, forecastPoints, plannedPoints, verdict, differencePoints.

Validation: exit code 1, nothing on stdout, and a stderr message starting "Error:" that names the field, when sprintLengthDays is not a whole number from 1 to 30; team is empty; a member name is duplicated; leaveDays is below 0 or above sprintLengthDays; allocation is outside 0.1 to 1.0; any pastVelocities value or plannedPoints is negative or not a whole number. Also exit 1 for a missing file ("Error: file not found: <path>") or invalid JSON ("Error: invalid JSON in <path>").

Non-functional: Node.js built-ins only at runtime, no network calls; finishes in under 1 second for 50 members; no secrets in code; every requirement has at least one automated test whose name starts with its requirement ID.

Out of scope: user interface, database, user accounts, multiple sprints per file, story-level planning.

Write user stories with priorities, numbered functional requirements (FR-001 ...), non-functional requirements, and measurable acceptance criteria that can each be checked as pass or fail. List assumptions and any unresolved questions.