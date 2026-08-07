# 10 — Testing & Quality

## Repository gates
The root defines Vitest, Angular lint/build and Playwright; backend defines Jest/build/E2E. For broad changes the canonical local gate is `npm run verify:local`.

## Required by change type
- Pure docs: validate links/paths and inspect diff; no executable files should change.
- Angular logic/UI: lint + relevant Vitest + production build; critical journey changes add/update Playwright.
- NestJS/domain: relevant Jest + backend build; HTTP contract changes add integration/E2E tests.
- Database/migration: migration review plus tests against the supported database path; verify forward migration and recovery approach.
- Workflow/import/media/stock/payment/auth: success + validation rejection + unauthorized/invalid transition + retry/idempotency/data-integrity cases as applicable.

## Test quality
Tests assert business outcomes, not implementation trivia. Do not weaken/remove assertions merely to make a change pass. Flaky tests are defects: identify cause; do not normalize blanket retries/skips.

## PR evidence
Record commands run and results. If a required check cannot run, state exactly why, what remains unverified, and what alternative evidence exists. “Not run” is acceptable only when explicit; fabricated test results are prohibited.

## Regression rule
Every confirmed production regression fixed in code SHOULD gain a regression test at the cheapest layer capable of preventing recurrence.
