# 06 — Database: PostgreSQL

PostgreSQL is the production durable system of record. The codebase currently supports SQLite as a local/test compatibility option; this does not change the production authority.

## Schema governance
- TypeORM migrations are mandatory for production schema evolution. `synchronize: false` remains the production rule.
- Migrations are immutable once released; correct mistakes with a new migration.
- Use database constraints/indexes for stable integrity rules: unique codes/SKUs/barcodes where domain-defined, foreign keys, non-null/check constraints where safe.
- Migration PRs must state forward behavior, locking/size risk, compatibility window, and rollback/restore strategy.

## Data rules
- Preserve product codes and other identifiers as domain identifiers, not arithmetic values.
- Money must use an exact representation; stock mutations must be atomic/auditable.
- Timestamps require explicit semantics/timezone handling. Status columns use controlled vocabularies synchronized with domain code.
- Do not delete audit/history/import evidence merely to reduce table size; define retention policy first.

## Query/transaction rules
Avoid N+1 query patterns on catalog/admin lists; paginate unbounded collections; index measured access paths. Cross-entity workflow transitions use transactions where partial success would violate invariants.

## Operations
Production credentials use least privilege and environment configuration. Backups and restore tests are governed by [Backup & Disaster Recovery](16-backup-disaster-recovery.md).
