# Product Owner review (SC-005)

Rate each output: is it clear enough to support a retrospective follow-up?
Record your ratings in evals/po-ratings.json (see the example at the end), commit, and run the harness again.

## C01 – Daily stand-up and deployment

No output (FAIL).

## C02 – Testing bottleneck

No output (SERVICE_FAILURE).

## C03 – Unclear requirements

No output (SERVICE_FAILURE).

## C04 – Remote collaboration

No output (SERVICE_FAILURE).

## C05 – Tools and environment

No output (SERVICE_FAILURE).

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
