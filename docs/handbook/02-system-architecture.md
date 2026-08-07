# 02 — System Architecture

## Current shape
The repository contains an Angular 21 storefront/admin application (`src/`), NgRx client state for selected domains, a NestJS 11 API (`backend/src/`), TypeORM persistence, PostgreSQL production support, migration files, Playwright E2E tests, and a platform subsystem for import/media/jobs/audit/taxonomy/merchandising/SEO/workflow.

## Layer contract
`Browser → Angular feature/core services → HTTP API → NestJS controllers → services/domain engines → TypeORM → PostgreSQL`.

- Components MUST NOT reach databases/filesystems or encode authoritative permissions.
- Angular API services centralize transport concerns; state stores must not duplicate server authority.
- NestJS controllers translate transport concerns; substantial business logic belongs in services/domain engines.
- Services coordinate transactions, invariants, audit, jobs and persistence.
- Database constraints protect uniqueness/referential/transactional integrity where feasible.

## Product/platform spine
The existing products/platform architecture is the spine. Import, variation detection, media, taxonomy, SEO, merchandising, jobs, audit and workflow MUST extend it rather than create a parallel catalog. See [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md).

## Transitional integrations
The repository contains WordPress compatibility/migration code and local/generated catalog utilities. These MUST be treated as integration/migration surfaces, not permission to create a second production source of truth. Any migration must define direction, conflict policy, idempotency, reconciliation, and retirement criteria.

## Architecture change gate
A PR introducing a new persistence technology, queue, external source of truth, product model, auth mechanism, or cross-cutting framework MUST include an architecture decision in documentation, failure/rollback analysis, and explicit owner approval.
