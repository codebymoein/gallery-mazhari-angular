# 10 — Testing & Quality

## Repository gates
The root defines Vitest, Angular lint/build and Playwright; backend defines Jest/build/E2E. For broad changes the canonical local gate is `npm run verify:local`.

`verify:local` is a **broad-change / certification gate**, not the default command for every edit. Agents MUST select verification proportionate to the boundaries actually touched. A smaller verification set is not a bypass when it fully covers the declared change scope; unrelated gates MUST NOT be run merely to inflate the check count or duplicate unchanged-boundary evidence.

GitHub PR verification follows the same principle. `.github/workflows/quality-gates.yml` first classifies the actual PR diff and runs only the blocking jobs applicable to the touched surfaces. The stable `Required quality gates` result accepts intentionally skipped non-applicable jobs, while governance classification and secret scanning remain blocking. Full execution remains available through `workflow_dispatch` and for change surfaces that automatically escalate to Tier C.

Historic evidence workflows are also scope-gated. RM-09 runs only for source/static-analysis surfaces; RM-12 runs only for SSR/HTML/TypeScript/build surfaces; RM-13 runs only for browser-behavior/CWV surfaces; RM-17 runs automatically only for release-critical backend/deploy/dependency/build-config surfaces and remains manually dispatchable for explicit certification.

## Risk-based verification tiers
Choose the lowest tier that fully covers the change. Escalate immediately when the diff crosses a listed boundary or when a task/release contract explicitly requires a broader gate.

### Tier A — isolated presentation/UI polish
Use when the change is limited to presentation such as spacing, sizing, typography, color, icon alignment, decorative layout, or animation timing and does not alter routing, data flow, client state semantics, SSR behavior, accessibility semantics, or a critical journey.

Required evidence:
- frontend lint for the affected Angular surface;
- Stylelint when styles are changed and the repository exposes that gate;
- focused existing test(s) when the edited surface already has relevant automated coverage;
- frontend production browser/SSR build when the public Angular bundle or stylesheet is changed;
- focused browser/manual viewport evidence when responsive layout or visible interaction is the purpose of the change.

Not required solely because Tier A work occurred: backend Jest/build, database/PostgreSQL gates, migrations, dependency/security audits, sitemap/SEO governance, Lighthouse, or the full Playwright suite, unless another touched boundary or explicit task contract makes one of them applicable.

### Tier B — frontend behavior / public-experience change
Use when Angular logic, client state, routing, menus, forms, search UI behavior, SSR/hydration behavior, accessibility semantics, or a critical storefront journey changes.

Required evidence:
- frontend lint;
- relevant Vitest tests;
- production browser/SSR build;
- focused Playwright coverage for the changed journey;
- accessibility, SEO, or performance checks only when that contract is touched or when the task specifically requires them.

Backend/database/security gates become applicable only if the change modifies or depends on those boundaries beyond an unchanged API contract.

### Tier C — cross-boundary, critical, or certification change
Use for Angular + backend/shared-contract changes, business workflow changes, auth/security, schema/data/migrations, media pipeline, dependency changes, deployment/runtime work, release certification, or any task whose governing contract requires full evidence.

Run the complete applicable repository gate set, including `npm run verify:local` or the task-specific certification suite when defined, plus any domain-specific checks required by this Handbook.

## Escalation rules
- File count alone does not determine the tier; behavioral and architectural risk does.
- A one-line auth, routing, schema, payment, stock, or workflow change can require Tier C.
- A large CSS-only cleanup can remain Tier A if it truly does not change behavior or governed semantics.
- If a focused check reveals an unexplained regression outside the declared surface, expand verification before completion.
- CI may intentionally run broader permanent regression controls, but those controls SHOULD use path/diff scope where the risk boundary is objectively detectable.
- Never relabel a change into a lower tier to avoid a failing relevant gate.

## Required by change type
- Pure docs: validate links/paths and inspect diff; no executable files should change.
- Angular logic/UI: lint + relevant Vitest + production build; critical journey changes add/update Playwright.
- NestJS/domain: relevant Jest + backend build; HTTP contract changes add integration/E2E tests.
- Database/migration: migration review plus tests against the supported database path; verify forward migration and recovery approach.
- Workflow/import/media/stock/payment/auth: success + validation rejection + unauthorized/invalid transition + retry/idempotency/data-integrity cases as applicable.

## Test quality
Tests assert business outcomes, not implementation trivia. Do not weaken/remove assertions merely to make a change pass. Flaky tests are defects: identify cause; do not normalize blanket retries/skips.

## PR evidence
Record the selected verification tier, commands run and results. If a required check cannot run, state exactly why, what remains unverified, and what alternative evidence exists. “Not run” is acceptable only when explicit; fabricated test results are prohibited.

For a focused frontend-only PR, explicitly record unrelated backend/database/security/release gates as **not applicable by scope** rather than pretending they passed or running them without a risk reason. Before merge, the final applicable set is determined by the actual final diff plus any explicit PR/release/certification requirements.

## Regression rule
Every confirmed production regression fixed in code SHOULD gain a regression test at the cheapest layer capable of preventing recurrence.
