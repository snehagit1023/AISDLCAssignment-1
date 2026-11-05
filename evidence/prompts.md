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
