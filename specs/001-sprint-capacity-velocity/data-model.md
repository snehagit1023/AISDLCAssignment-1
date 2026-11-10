# Data Model: Sprint Capacity & Velocity Calculator

## Sprint Input

One JSON object describing a single sprint.

| Field | Type | Required | Validation / meaning |
|-------|------|----------|----------------------|
| `sprintLengthDays` | Integer | Yes | Whole number from 1 through 30 inclusive. |
| `team` | Array of Team Member | Yes | Must contain at least one member. |
| `pastVelocities` | Array of non-negative integers | Yes | Ordered oldest first; empty is valid and means no history. |
| `plannedPoints` | Non-negative integer | Yes | Planned story-point total. |

Required top-level properties must be present. Numeric values must be finite JSON numbers;
numeric strings, nulls, and booleans are not accepted as numbers.

## Team Member

| Field | Type | Required | Validation / default |
|-------|------|----------|----------------------|
| `name` | String | Yes | Must not be empty or whitespace-only. Duplicate names are rejected after trimming and case-insensitive normalization. |
| `leaveDays` | Number | No | Defaults to `0`; otherwise finite and from 0 through sprint length inclusive. Fractional leave is valid. |
| `allocation` | Number | No | Defaults to `1.0`; otherwise finite and from 0.1 through 1.0 inclusive. |

The roster order is retained for deterministic validation, but names do not affect
calculations except for duplicate detection.

## Sprint Report

One normalized result. The JSON representation has exactly these properties, in order:

| Field | Type | Meaning |
|-------|------|---------|
| `fullCapacityDays` | Number | Sum of sprint length times each member allocation, rounded half up to one decimal place. |
| `availableCapacityDays` | Number | Sum of remaining member days times allocation, rounded half up to one decimal place. |
| `averageVelocity` | Number or null | Mean of the newest three historical sprint values, or all values when fewer than three exist; rounded half up to one decimal. Null when history is empty. |
| `forecastPoints` | Integer or null | Floor of the unrounded mean of selected history times available capacity divided by full capacity; null when history is empty. |
| `plannedPoints` | Integer | The validated input planned point total. |
| `verdict` | String | `OVER_COMMITTED`, `FITS`, `UNDER_COMMITTED`, or `NO_HISTORY`. |
| `differencePoints` | Integer or null | Excess planned points, zero for `FITS`, forecast shortfall for `UNDER_COMMITTED`, or null for `NO_HISTORY`. |

When history exists, compare planned points with forecast: values above forecast are
`OVER_COMMITTED`; values from 80% of forecast through forecast inclusive are `FITS`;
values below 80% are `UNDER_COMMITTED`. When forecast is zero, zero planned points is
`FITS`; positive planned points are `OVER_COMMITTED`.

## Validation and State

There is no persisted lifecycle or mutation. Validation is performed for each invocation
and the first error in the fixed validation order is returned. Valid empty history is a
successful result state (`NO_HISTORY`), not an input error. Invalid input never yields a
partial report.
