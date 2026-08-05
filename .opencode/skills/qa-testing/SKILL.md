---
name: qa-testing
description: Create and execute a risk-based verification strategy. Determine the narrowest relevant commands, follow existing test conventions, and report only actual results.
---

# qa-testing

Plan and execute verification of changes or features.

## When to use
- Verifying a change or feature.
- Writing or updating tests.
- Confirming a release candidate.

## When NOT to use
- Onboarding; code review of unrelated changes.

## Inputs
- The change/feature and affected areas.
- Existing test conventions (Vitest specs, Jest specs, Playwright e2e).

## Include in the strategy (as relevant)
Happy path; validation failures; edge cases; permission cases; error handling; accessibility checks; responsive behavior; regression cases; unit tests; integration tests; end-to-end tests; manual verification when automation is unavailable.

## Commands to consider (verify before running)
- `npm test` — frontend unit (Vitest)
- `npm --prefix backend test -- --runInBand` — backend unit (Jest)
- `npm run typecheck` — type-check/dev build
- `npm run lint` — frontend lint (has pre-existing errors)
- `npm run e2e` — Playwright (requires app + backend running)
- `npm run verify:local` — full local pipeline

## Rules
- Follow existing test conventions; do not add a new testing framework without approval.
- Never claim unrun tests passed.
- Ask before running unusually expensive or destructive checks (e.g. full e2e that needs servers).
- Document blocked tests and reasons.

## Expected output
- Test matrix.
- Commands run.
- Passed checks.
- Failed checks.
- Blocked checks.
- Uncovered risk.
- Recommended next tests.

## Completion criteria
- The narrowest relevant verification ran and was reported truthfully.
- Blocked tests and uncovered risk documented.
