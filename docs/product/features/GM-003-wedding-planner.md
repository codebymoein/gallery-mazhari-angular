# GM-003 — Wedding Planner

## Identity
- Feature ID: GM-003
- Title: Wedding Planner
- Request owner: Gallery Mazhari owner
- Change class: L3 product feature
- Priority: P1
- Related epic: EPIC-05 — Customer experience
- Dependencies: GM-001 and GM-002 merged; existing customer auth/user model is reused.

## Problem / outcome
### Current problem
The storefront can remember one ceremony date in browser-only `WeddingTimelineService`, but it has no durable customer-owned planning journey, checklist, progress or date-aware actions. Browser storage cannot be the authority for this business feature.

### Desired outcome
An authenticated customer can create one personal wedding planner, choose ceremony types and date, receive a server-generated checklist, mark tasks complete, see progress and follow contextual actions to existing catalog/consultation journeys. PostgreSQL is authoritative and the experience resumes across devices after login.

### Users / roles affected
- Customer: owns and edits only their own planner.
- Guest: may view the planner entry screen but must login/register before durable planner use.
- Staff/admin: no planner management capability in this slice.

## Acceptance criteria
1. `/planner` is a noindex customer route with mobile-first RTL setup, progress and checklist states.
2. Planner persistence is PostgreSQL-backed and keyed one-to-one to an authenticated `CUSTOMER` user.
3. Setup requires at least one supported ceremony type and a valid date from today through three years ahead.
4. The backend returns a canonical task catalog enriched with relative urgency/status from the saved event date; Angular does not invent authoritative task IDs or completion state.
5. A customer can complete/reopen only known task IDs; unknown IDs are rejected.
6. Every mutation requires the latest planner version; stale writes return a machine-identifiable conflict instead of silently overwriting newer state.
7. A customer cannot read or mutate another customer's planner; planner endpoints reject unauthenticated and non-customer roles.
8. Contextual actions reuse existing `/catalog`, `/accessories` and `/consultation` journeys and do not duplicate their backend workflows.
9. Existing browser-only Wedding Timeline may remain as presentation compatibility, but it is not read as authoritative planner data.
10. Lint/tests/build, backend tests, migration chain, Playwright, SSR/accessibility/CWV and permanent regression gates pass on the final PR head.

## Scope
### In scope
- `WeddingPlannerEntity` and forward TypeORM migration.
- Canonical server-side ceremony/task definitions.
- Customer-only `GET /planner/me`, `PUT /planner/me`, `PATCH /planner/me/tasks/:taskId`, `DELETE /planner/me`.
- Optimistic version token on all planner mutations after creation.
- Angular planner API/customer-auth orchestration and `/planner` feature UI.
- Login/register inline state using existing `/auth/login`, `/auth/register`, `/auth/profile` contracts.
- Home/account entry points where bounded and useful.
- Backend unit/integration-style service/controller tests and Playwright planner journey coverage.
- Handbook/API documentation updates required by the new persistent/API contract.

### Explicit non-scope
- Guest capability-token authentication or a second auth mechanism.
- SMS/email/push reminders or background notification jobs.
- Admin planner dashboard or CRM synchronization.
- ERP integration.
- GM-004 bespoke-service implementation.
- New consultation/order/product workflow semantics.
- Calendar integrations.

## Impact analysis
| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | New `/planner` route and typed API/auth orchestration. |
| SSR/hydration | low | Route is noindex; browser API state hydrates after render. |
| API/DTO contracts | yes | New planner endpoints/DTOs; existing auth reused unchanged. |
| NestJS business logic | yes | Planner ownership, validation, task derivation and concurrency. |
| Auth/permissions/audit | yes | JWT + `CUSTOMER` role; no new auth mechanism. |
| PostgreSQL/schema/migration | yes | New one-planner-per-user table with non-null unique owner key and optimistic version. |
| Existing data compatibility | yes | Additive empty table; no existing row transformation. |
| Protected business workflows | no | Existing consultation/catalog/product workflows are linked only. |
| Media/storage | no | No uploads/media. |
| SEO | low | `/planner` is noindex/nofollow. |
| Accessibility | yes | Forms, errors, task controls, focus and status announcements. |
| Performance | low | One bounded planner row and fixed-size task catalog. |
| Deployment/config/monitoring | low | Normal migration-before-code release ordering; no new env vars. |
| Documentation | yes | Feature contract + API/handbook contract notes. |

## Architecture / data design
- Existing owner: NestJS auth/users + PostgreSQL persistence.
- New domain concept: one `WeddingPlanner` per customer user.
- Source of truth: PostgreSQL.
- Server invariants: authenticated customer ownership; supported ceremony types; bounded date; known task IDs; version conflict rejection.
- Representation: `wedding_planners` row with non-null uniquely indexed `userId`, `eventDate`, JSON-compatible ceremony type list, completed task ID list, integer `version`, timestamps.
- Ownership is derived from the authenticated JWT `userId`; planner requests never accept an owner identifier from the client.
- The historical migration registry predates the `users` table bootstrap and must remain replayable on an empty database. GM-003 therefore does not add a physical `users` foreign key in this migration; it preserves unique owner-key integrity without rewriting released migrations.
- Task definitions are code-owned server constants because they are versioned product behavior, not customer-authored data.
- Existing browser Wedding Timeline cannot satisfy durable cross-device ownership and therefore remains a non-authoritative compatibility surface.

## Security and failure behavior
- Authorization: authenticated `UserRole.CUSTOMER` only.
- Inputs: DTO allowlists, date format/range, ceremony enum, task ID allowlist, integer version.
- Partial failure: mutations are one-row transactional/atomic operations; failed writes leave state unchanged.
- Concurrency: conditional update/delete on expected version; stale clients receive `planner_version_conflict`.
- Audit: this slice relies on planner timestamps/version; no privileged admin mutation exists. A later admin workflow would require explicit audit design.

## UX / visual decision
- Warm editorial GM-001 visual language; mobile-first timeline/checklist rather than SaaS dashboard cards.
- Setup asks ceremony type(s) then date; planner shows countdown, progress and grouped tasks.
- Completed tasks remain visible and reversible.
- Contextual CTA appears only where a canonical task defines one.
- RTL, semantic form controls, keyboard operation, visible focus and reduced motion are required.

## Implementation plan
1. Add migration/entity/module/task catalog and customer-only API with version conflict behavior.
2. Add backend tests for create/read/update/task/rejection/authorization-facing contracts.
3. Add typed Angular customer auth + planner API service and `/planner` UI.
4. Add bounded Home/Account links and permanent Playwright coverage.
5. Update API/Handbook documentation and run exact-head CI.

## Verification plan
- Unit/backend: task derivation, validation, ownership and stale-version conflicts.
- PostgreSQL: canonical migration chain/schema drift gate.
- Browser/E2E: guest auth state; register/login; planner setup; task completion; persistence/reload; invalid/stale rejection where testable.
- SSR/SEO/accessibility/performance: permanent RM-12/RM-13/Quality gates plus route noindex contract.
- Manual V2 acceptance required before merge because this is a material customer journey.

## Recovery
- Code rollback: revert focused PR.
- Migration recovery: additive table can remain unused during code rollback; destructive down migration is not the normal production rollback strategy.
- Roll-forward: fix planner code/API against the additive schema; no existing business data migration is required.

## Delivery
- Branch: `feat/gm-003-wedding-planner`
- PR: focused GM-003 PR to `main`
- Documentation: feature contract, backlog, relevant API/Handbook notes.
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
