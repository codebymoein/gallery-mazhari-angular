# GM-016 — Clear frontend ESLint error baseline

## Identity

- Feature ID: `GM-016`
- Title: Clear the pre-existing frontend ESLint error baseline without changing business behavior
- Request owner: Gallery Mazhari owner
- Change class: `L1 presentation/correctness`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: existing post-redesign frontend baseline

## Problem / outcome

### Current problem
The repository-wide frontend lint gate retains seven known errors in existing Angular/template code. They obscure new regressions and force every focused PR to carry a documented baseline exception.

### Desired outcome
Remove those errors with minimal semantic edits so future lint failures are attributable to new work. Existing warning debt is intentionally not bundled into this change.

### Users / roles affected
Developers and agents maintaining the storefront/admin frontend. Customer and admin business behavior must remain unchanged.

## Acceptance criteria

1. The seven documented ESLint/template errors are removed without disabling or weakening lint rules.
2. Existing workflows, payloads, state transitions, and visible product behavior remain unchanged.
3. Frontend tests and production browser/SSR build pass on the exact PR head.
4. Existing warning debt remains separately visible rather than silently suppressed.

## Scope

### In scope
- Minimal expression/control-flow cleanup in Dream Canvas and marketing admin code.
- Existing template lint corrections for custom requests and marketing date labels.
- The one `prefer-const` correction in staging queue local fallback.
- Product tracking/evidence for this focused change.

### Explicit non-scope
- Broad formatting/refactoring.
- Existing `no-explicit-any` and other warning debt.
- Business logic changes to staging/import behavior.
- Backend, API, auth, PostgreSQL, schema, deployment, GM-006 motion, UAT or Production GO.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Lint-safe equivalent expressions/templates only |
| SSR/hydration | no | No platform ownership change |
| API/DTO contracts | no | None |
| NestJS business logic | no | None |
| Auth/permissions/audit | no | None |
| PostgreSQL/schema/migration | no | None |
| Existing data compatibility | no | None |
| Protected business workflows | no | Semantics preserved |
| Media/storage | no | None |
| SEO | no | None |
| Accessibility | yes | Existing marketing date labels receive explicit control association |
| Performance | no | None |
| Deployment/config/monitoring | no | Normal source artifact only |
| Documentation | yes | Backlog/spec/evidence |

## Architecture / data design

- Existing capability/service that should own this change: existing Angular components/services.
- New domain concept required: none.
- Source of truth: unchanged; NestJS/PostgreSQL remain authoritative for durable business state.
- Server-side invariants: unchanged.
- Database representation: none.

## Security and failure behavior

No authorization, input-validation, persistence, concurrency or audit semantics are changed.

## UX / visual decision

No redesign is intended. The marketing date controls retain the current UI while improving label association. No motion or layout work is included.

## Implementation plan

1. Replace lint-triggering expressions with equivalent explicit control flow/null-safe iteration.
2. Correct existing label association and useless escape/prefer-const findings.
3. Run exact-head lint/tests/build/CI and inspect the final diff for scope.

## Verification plan

- Unit tests: existing frontend Vitest suite.
- Backend/integration tests: no backend diff; required CI remains authoritative.
- PostgreSQL/migration verification: not applicable.
- Browser/E2E tests: required repository CI as applicable to changed surfaces.
- SSR/SEO/accessibility/performance evidence: production browser/SSR build and existing CI gates.
- Manual/staging acceptance: no subjective visual redesign; verify no behavior change if staging review is required.

## Recovery

- Code rollback/revert: revert the focused GM-016 PR.
- Data/migration recovery: none.
- Feature disable/roll-forward: not applicable.

## Delivery

- Planned branch: `fix/gm-016-clear-lint-errors`
- Planned PR: focused GM-016 PR to `main`
- Documentation to update: `docs/product/BACKLOG.md`, this specification
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
