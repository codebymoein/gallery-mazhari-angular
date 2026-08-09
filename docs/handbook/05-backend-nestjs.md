# 05 — Backend: NestJS

NestJS 11 is the authoritative application/business API. Current domains include auth/users, products, orders, payments, consultations, custom requests, discounts, notifications, appearance/gallery, wedding planner, and the platform subsystem.

## Boundaries
- Controllers: transport, DTO binding, auth decorators/guards, response mapping. Keep business algorithms out.
- Services/domain engines: invariants, state transitions, transactions, idempotency, audit, integration orchestration.
- DTOs: validate all externally supplied fields with `class-validator`; never trust Angular validation.
- Entities: persistence mapping and constraints; avoid embedding transport assumptions.

## Authorization
Every privileged mutation MUST have server-side authentication plus role/permission enforcement appropriate to the action. New admin endpoints require a test proving unauthorized/insufficient-permission rejection.

## Customer Wedding Planner
`PlannerModule` owns the durable Wedding Planner API. `GET/PUT /planner/me`, `PATCH /planner/me/tasks/:taskId`, and `DELETE /planner/me` are authenticated customer-only operations. The authenticated `userId` determines ownership; clients never supply an owner ID. PostgreSQL owns the saved event date, ceremony types, completed task IDs and planner version. Canonical task IDs, applicability, due-date projection and progress are server-derived. Mutations carry the latest planner version and stale writers are rejected with `planner_version_conflict` rather than silently overwriting a newer planner. Existing catalog/accessories/consultation routes are linked as actions only; Planner does not duplicate their business workflows.

## Transactions and jobs
Multi-record state transitions that must succeed together use transactions. Background jobs must record status/error, support safe retry, and avoid duplicate business effects. Long imports/media processing should not depend on a browser request remaining open.

## API evolution
Breaking response/request/status changes require consumer search, frontend update, tests, and documentation. Prefer additive compatibility where practical. Errors should be machine-identifiable and safe for users/logs.

## Verification
Run backend tests and build: `npm --prefix backend test -- --runInBand` and `npm --prefix backend run build`; use backend E2E tests when changing HTTP integration.
