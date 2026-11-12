# Product Owner review (SC-005)

Rate each output: is it clear enough to support a retrospective follow-up?
Record your ratings in evals/po-ratings.json (see the example at the end), commit, and run the harness again.

## C01 – Daily stand-up and deployment

Themes:
- Stand-up Efficiency (comments 1, 4)
- CI/CD and Deployments (comments 2, 5)
- Teamwork and Collaboration (comments 3, 6)

Action items:
- [SCRUM_MASTER] Enforce strict timeboxing for daily stand-ups and move deep-dive problem solving offline (comments 1, 4)
- [TEAM] Investigate and address staging deployment failures and pipeline bottlenecks (comments 2, 5)
- [TEAM] Encourage pair programming sessions to support knowledge sharing and onboarding (comments 3, 6)

## C02 – Testing bottleneck

Themes:
- Testing and Quality Assurance (comments 1, 2, 3, 4, 5)

Action items:
- [TEAM] Ensure stories are delivered to QA earlier in the sprint to avoid bottlenecks (comments 1, 4)
- [PRODUCT_OWNER] Establish a process for writing test cases prior to the start of development (comments 5)

## C03 – Unclear requirements

Themes:
- Requirements and Acceptance Criteria (comments 1, 3, 5)
- Product Owner Availability (comments 2)
- Backlog Refinement (comments 4)

Action items:
- [PRODUCT_OWNER] Ensure all user stories have clear and complete acceptance criteria prior to sprint planning (comments 1, 5)
- [PRODUCT_OWNER] Establish communication guidelines and availability expectations during active sprints (comments 2)
- [TEAM] Implement a formal change control process to handle requirement modifications during a sprint (comments 3)
- [SCRUM_MASTER] Schedule regular backlog refinement sessions consistently each sprint (comments 4)

## C04 – Remote collaboration

Themes:
- Collaboration and Communication (comments 1, 3, 4)
- Tools and Infrastructure (comments 2, 5)

Action items:
- [TEAM] Establish clear handover protocols and overlap hours for distributed team members. (comments 1)
- [SCRUM_MASTER] Review and test video conferencing stability before upcoming planning sessions. (comments 2)
- [TEAM] Encourage active participation and inclusive communication guidelines during virtual meetings. (comments 4)

## C05 – Tools and environment

Themes:
- Performance and Infrastructure (comments 1, 2, 4)
- Code Review Process (comments 3, 5)

Action items:
- [TEAM] Investigate CI pipeline bottlenecks to reduce build time (comments 1)
- [SCRUM_MASTER] Coordinate with infrastructure to improve test environment reliability (comments 2)
- [TEAM] Review hardware allocation and IDE settings to resolve performance issues (comments 4)
- [TEAM] Establish a service level agreement or team norm for code review turnaround times (comments 5)

## Example evals/po-ratings.json

```json
{
  "ratedRun": "run-NNN-label",
  "ratedBy": "Product Owner",
  "ratings": [
    {
      "caseId": "C01",
      "clear": true,
      "note": ""
    },
    {
      "caseId": "C02",
      "clear": true,
      "note": ""
    },
    {
      "caseId": "C03",
      "clear": true,
      "note": ""
    },
    {
      "caseId": "C04",
      "clear": true,
      "note": ""
    },
    {
      "caseId": "C05",
      "clear": true,
      "note": ""
    }
  ]
}
```
