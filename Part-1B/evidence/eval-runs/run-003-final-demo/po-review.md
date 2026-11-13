# Product Owner review (SC-005)

Rate each output: is it clear enough to support a retrospective follow-up?
Record your ratings in evals/po-ratings.json (see the example at the end), commit, and run the harness again.

## C01 – Daily stand-up and deployment

Themes:
- Daily Stand-ups (comments 1, 4)
- Deployment and Release Pipeline (comments 2, 5)
- Collaboration and Teamwork (comments 3, 6)

Action items:
- [SCRUM_MASTER] Enforce strict timeboxing for daily stand-ups and defer detailed problem solving to separate offline discussions. (comments 1, 4)
- [TEAM] Investigate staging deployment stability and optimize the release pipeline to unblock testing. (comments 2, 5)
- [TEAM] Encourage continuous pair programming practices to support onboarding and knowledge sharing. (comments 3, 6)

## C02 – Testing bottleneck

Themes:
- Testing and Quality Assurance (comments 1, 2, 3, 4, 5)

Action items:
- [TEAM] Improve flow of stories to QA to avoid end-of-sprint bottlenecks (comments 1, 4)
- [PRODUCT_OWNER] Ensure test cases are written prior to the start of development (comments 5)

## C03 – Unclear requirements

Themes:
- Requirements and Backlog Management (comments 1, 3, 4, 5)
- Stakeholder Availability (comments 2)

Action items:
- [PRODUCT_OWNER] Ensure all user stories have clear acceptance criteria prior to sprint planning. (comments 1, 5)
- [PRODUCT_OWNER] Establish communication guidelines and core availability hours for requirement queries. (comments 2)
- [TEAM] Define a formal process for handling mid-sprint requirement changes. (comments 3)
- [PRODUCT_OWNER] Maintain consistency in holding scheduled backlog refinement sessions. (comments 4)

## C04 – Remote collaboration

Themes:
- Collaboration and Communication (comments 1, 3, 4)
- Tools and Infrastructure (comments 2, 5)

Action items:
- [TEAM] Establish a clear handover protocol and core overlap hours for distributed team members. (comments 1)
- [SCRUM_MASTER] Review and test network stability and video conferencing tool configurations prior to sprint planning. (comments 2)
- [TEAM] Encourage active participation and discuss meeting engagement guidelines during the next retrospective. (comments 4)

## C05 – Tools and environment

Themes:
- Performance and Infrastructure (comments 1, 2, 4)
- Code Review Process (comments 3, 5)

Action items:
- [TEAM] Investigate CI build pipeline optimization to reduce wait times (comments 1)
- [SCRUM_MASTER] Coordinate with IT to address environment stability and hardware performance issues (comments 2, 4)
- [TEAM] Establish team guidelines for faster code review turnaround times (comments 5)

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
