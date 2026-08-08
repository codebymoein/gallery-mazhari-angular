# Feature / Change Specification Template

Use this template before material feature implementation. Keep it proportional: a small L1 change may need only a few lines; an L3/L4 change needs enough detail to prove the design is safe.

## Identity

- Feature ID:
- Title:
- Request owner:
- Change class: `L1 presentation | L2 frontend behavior | L3 product feature | L4 architecture/workflow`
- Priority:
- Related epic:
- Dependencies / related items:

## Problem / outcome

### Current problem
What is difficult, incorrect, missing or undesirable today?

### Desired outcome
Describe the user/business result, not an implementation guess.

### Users / roles affected
Who can see/use this behavior?

## Acceptance criteria

1.
2.
3.

Include rejection/error/permission behavior where material.

## Scope

### In scope
-

### Explicit non-scope
-

## Impact analysis

Record `yes/no` plus a short reason.

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state |  |  |
| SSR/hydration |  |  |
| API/DTO contracts |  |  |
| NestJS business logic |  |  |
| Auth/permissions/audit |  |  |
| PostgreSQL/schema/migration |  |  |
| Existing data compatibility |  |  |
| Protected business workflows |  |  |
| Media/storage |  |  |
| SEO |  |  |
| Accessibility |  |  |
| Performance |  |  |
| Deployment/config/monitoring |  |  |
| Documentation |  |  |

## Architecture / data design

- Existing capability/service that should own this change:
- New domain concept required, if any:
- Source of truth:
- Server-side invariants:
- Database representation, if any:
- Why an existing model/path cannot satisfy the requirement, if a new one is introduced:

For L4 changes, link the approved architecture decision/proposal.

## Security and failure behavior

- Who is authorized?
- What inputs are untrusted and how are they validated?
- What happens on partial failure?
- Concurrency/idempotency implications:
- Audit requirements:

## UX / visual decision

For material UI work:

- Approved intended state/interaction:
- Reused design-system primitives/tokens:
- Mobile/RTL/accessibility considerations:

Do not start broad visual implementation while the intended outcome is unresolved.

## Implementation plan

List cohesive implementation steps/layers. Do not include unrelated cleanup.

1.
2.
3.

## Verification plan

- Unit tests:
- Backend/integration tests:
- PostgreSQL/migration verification:
- Browser/E2E tests:
- SSR/SEO/accessibility/performance evidence:
- Manual/staging acceptance:

## Recovery

- Code rollback/revert:
- Data/migration recovery:
- Feature disable/roll-forward path when applicable:

## Delivery

- Planned branch:
- Planned PR:
- Documentation to update:
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
