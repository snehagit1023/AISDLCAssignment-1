# Assignment 1 – SDD & Harness Engineering

AI-Augmented SDLC (SEZG534) · BITS Pilani WILP · Sneha Sharma

| Part | Application | Type | Folder |
|---|---|---|---|
| 1A | Sprint Capacity & Velocity Calculator – capacity, velocity forecast and sprint verdict from a JSON sprint plan | deterministic Node.js CLI | [Part-1A](Part-1A/) |
| 1B | Retro Feedback Assistant – themes, sentiment and action items from retrospective comments using Google Gemini | non-deterministic AI Node.js CLI | [Part-1B](Part-1B/) |

Both parts follow the GitHub Spec Kit flow (constitution → specify → clarify → plan → tasks → analyze → implement) with GitHub Copilot as the coding agent, and are validated by an independent harness. Each part has its own README with install and run instructions.

## Results

| Part | Harness | Final result | Repair cycles | Decision |
|---|---|---|---|---|
| 1A | 7 deterministic gates (integrity, lint, security, audit, unit tests, contract checks, traceability) | all gates PASS | 1 (speed test failure under load – diagnosed as environment, recorded as limitation) | ACCEPT with known limitations – see `Part-1A/evidence/harness-log.md` |
| 1B | 7 code gates + 15-case evaluation in 3 layers (schema, invariants/guardrails, quality score) | PASS 15/15, safety 4/4 | 2 (app-owned comments/metadata; prompt v2 for privacy placeholders) | ACCEPT with known limitations – see `Part-1B/evidence/harness-log.md` |

## Where to find things

```
Assignment-1/
├── README.md
├── Part-1A/   Spec Kit artifacts (specs/, .specify/), src/ + tests/, .harness/, evidence/
└── Part-1B/   Spec Kit artifacts (specs/, .specify/), src/ + tests/, evals/, .harness/, evidence/
```

- Prompts given to the coding agent: `Part-1A/evidence/prompts.md`, `Part-1B/evidence/prompts.md`
- Harness results: `Part-1A/evidence/harness-results.md`, `Part-1B/evidence/eval-results.md`
- Harness logs with the final human decision: `Part-1A/evidence/harness-log.md`, `Part-1B/evidence/harness-log.md`

The commit history of each part was kept when the two projects were combined into this repository.

## Demo videos

- Part 1A – Sprint Capacity & Velocity Calculator: https://drive.google.com/file/d/1pSNGpQSDUVfg7NutwQt88d-L9pG-Feme/view?usp=sharing
- Part 1B clip 1 – final demo run (run 3, C10 safety failure caught by the harness): https://drive.google.com/file/d/1Ut9bguMdF7S-XbWS0pO8SHxGNA2E6kYN/view?usp=sharing
- Part 1B clip 2 – repair 2 and re-run (run 4, PASS 15/15): https://drive.google.com/file/d/1pLCr-RKool-e31BiK3IK7LtakHdpfhg0/view?usp=sharing

## AI use and secrets

AI use is described in each part's README (section "AI use"). No API keys, credentials or `.env` files are included.
