# Data Model: Retro Feedback Assistant

This design describes in-memory records and the JSON contract. The CLI does not
persist comments or analysis results.

## RetrospectiveComment

Represents one nonblank input line after trimming, with a stable sequential ID and
privacy-redacted text.

| Field | Type | Constraints |
|---|---|---|
| `id` | integer | Starts at 1; consecutive in nonblank file order |
| `text` | string | Trimmed; email and matching phone numbers replaced before AI request and output |

Input validation accepts 1–50 nonblank comments, each at most 500 Unicode code
points. Blank lines are excluded before IDs are assigned. Empty input is represented
by an empty list and does not invoke Gemini.

Before a request, replace email addresses with `[EMAIL]` and phone numbers containing
7–15 digits, an optional leading `+`, and common spaces, hyphens, periods, or
parentheses with `[PHONE]`.

## Theme

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 1–40 characters |
| `commentIds` | integer array | Nonempty; every ID belongs to the input comments |

An `OK` result has 1–8 themes.

## SentimentAssessment

| Field | Type | Constraints |
|---|---|---|
| `commentId` | integer | Exactly one assessment for every comment; ID must exist |
| `label` | enum | `positive`, `neutral`, or `negative` |

## ActionItem

| Field | Type | Constraints |
|---|---|---|
| `action` | string | 1–120 characters; professional and does not repeat abusive language |
| `owner` | enum | `TEAM`, `SCRUM_MASTER`, or `PRODUCT_OWNER` |
| `commentIds` | integer array | Nonempty; every ID belongs to the input comments |

An `OK` result has at most 10 action items. At least one action item is required if
any comment is negative.

## AnalysisResult

| Field | Type | Constraints |
|---|---|---|
| `status` | enum | `OK` or `NEEDS_CLARIFICATION` |
| `comments` | `RetrospectiveComment[]` | Ordered, canonical redacted inputs |
| `themes` | `Theme[]` | See status-specific invariants |
| `sentiment` | `SentimentAssessment[]` | Exactly one per comment for `OK` |
| `actionItems` | `ActionItem[]` | See `OK` invariants |
| `clarification` | string or null | Null for `OK`; nonempty question when clarification is needed |
| `meta` | object | Exactly `model`, `temperature`, `promptVersion` |

`meta.model` is the selected model ID, `meta.temperature` is the informational
configured value `0.2`, and `meta.promptVersion` is `v1`. The model response's
comment and metadata fields must match the canonical redacted comments and runtime
configuration before a result is emitted.

### State and invariants

- `OK`: at least one theme; one sentiment per comment; `clarification` is null;
  no more than 8 themes and 10 action items; all references resolve; any negative
  sentiment requires an action item.
- `NEEDS_CLARIFICATION`: empty `themes`, `sentiment`, and `actionItems`; a
  nonempty question. For nonempty but irrelevant input, comments remain represented
  in the result. For empty input, comments are empty and Gemini is not called.
- No successful result may contain contact data or API keys in output or generated
  fields.
- Invalid JSON, shape, values, cross-references, privacy checks, or invariants are
  rejected and retried once by the analysis flow.

## EvaluationCase and EvaluationRun (human-owned)

These are conceptual records consumed or produced by the human-provided evaluation
runner; they are not implemented or authored by this plan.

- **EvaluationCase**: Human-owned input plus expected themes, sentiment, and action
  keywords; identifies its applicable `FR-###` requirement(s).
- **EvaluationRun**: Per-case Layer 1 schema, Layer 2 invariants/guardrails, and
  Layer 3 quality scores; records service failures separately and yields PASS,
  FAIL, or INCONCLUSIVE under FR-012 and FR-013 thresholds. It also records five
  Product Owner clarity ratings and whether at least four meet the approved threshold
  (SC-005).
