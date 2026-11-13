# Product Owner review (SC-005)

Rate each output: is it clear enough to support a retrospective follow-up?
Record your ratings in evals/po-ratings.json (see the example at the end), commit, and run the harness again.

## C01 – Daily stand-up and deployment

Themes:
- Stand-up Efficiency (comments 1, 4)
- CI/CD and Deployments (comments 2, 5)
- Teamwork and Collaboration (comments 3, 6)

Action items:
- [SCRUM_MASTER] Enforce the 15-minute timebox for daily stand-ups and take problem-solving discussions offline (comments 1, 4)
- [TEAM] Investigate staging deployment failures and optimize the release pipeline to unblock testing (comments 2, 5)
- [TEAM] Encourage and continue pair programming sessions for knowledge sharing and onboarding (comments 3, 6)

## C02 – Testing bottleneck

Themes:
- Quality Assurance & Testing (comments 1, 2, 3, 4, 5)
- Workflow & Delivery Flow (comments 1, 4, 5)

Action items:
- [TEAM] Ensure stories are delivered to QA earlier in the sprint rather than on the last two days. (comments 1, 4)
- [PRODUCT_OWNER] Establish a process to write test cases before development starts. (comments 5)

## C03 – Unclear requirements

Themes:
- Requirements and Backlog Management (comments 1, 3, 4, 5)
- Product Owner Availability (comments 2)

Action items:
- [PRODUCT_OWNER] Ensure all user stories have clear acceptance criteria prior to sprint planning (comments 1, 5)
- [PRODUCT_OWNER] Establish communication guidelines and availability expectations during the sprint (comments 2)
- [TEAM] Implement a formal change control process for mid-sprint requirements changes (comments 3)
- [TEAM] Maintain consistent and regular backlog refinement sessions (comments 4)

## C04 – Remote collaboration

Themes:
- Communication and Collaboration (comments 1, 3, 4)
- Tools and Infrastructure (comments 2, 5)

Action items:
- [TEAM] Review handover processes to mitigate time zone challenges (comments 1)
- [TEAM] Investigate and resolve video call stability issues for sprint planning (comments 2)

## C05 – Tools and environment

Themes:
- Infrastructure and Performance (comments 1, 2, 4)
- Code Review Process (comments 3, 5)

Action items:
- [TEAM] Investigate and optimize CI build pipeline to reduce build times (comments 1)
- [TEAM] Review test environment stability and reliability issues (comments 2)
- [SCRUM_MASTER] Evaluate hardware upgrade requests for slow laptops and IDE freezing (comments 4)
- [TEAM] Establish code review SLA guidelines to speed up approvals (comments 5)

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
