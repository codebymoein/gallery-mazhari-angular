# Gallery Mazhari Engineering Handbook

This is version-controlled Living Documentation for the real Angular + NestJS + TypeORM/PostgreSQL system in this repository. Normative precedence: `CONSTITUTION.md` → this handbook → task-specific docs → implementation comments. Existing specialized docs remain valuable evidence and must be reconciled rather than silently contradicted.

## Chapters
1. [Engineering Principles](01-engineering-principles.md)
2. [System Architecture](02-system-architecture.md)
3. [Development Rules](03-development-rules.md)
4. [Frontend — Angular](04-frontend-angular.md)
5. [Backend — NestJS](05-backend-nestjs.md)
6. [Database — PostgreSQL](06-database-postgresql.md)
7. [Business Workflows](07-business-workflows.md)
8. [Design System](08-design-system.md)
9. [Security](09-security.md)
10. [Testing & Quality](10-testing-quality.md)
11. [Git, PRs & Releases](11-git-pr-releases.md)
12. [AI Agent Rules](12-ai-agent-rules.md)
13. [Media & Storage](13-media-storage.md)
14. [Deployment & Operations](14-deployment-operations.md)
15. [Observability](15-observability.md)
16. [Backup & Disaster Recovery](16-backup-disaster-recovery.md)
17. [SEO, Performance & Accessibility](17-seo-performance-accessibility.md)
18. [Documentation Governance](18-documentation-governance.md)

## Canonical operational indexes
- [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md) — topic ownership and documentation precedence.
- [`../operations/ENVIRONMENT.md`](../operations/ENVIRONMENT.md) — canonical environment contract.
- [`../operations/SECRETS.md`](../operations/SECRETS.md) — secret management and rotation.
- [`../operations/TOOL_MANIFEST.md`](../operations/TOOL_MANIFEST.md) — commands, migrations, and operational tools.
- [`../operations/STALE_DOCUMENT_REGISTER.md`](../operations/STALE_DOCUMENT_REGISTER.md) — legacy/stale classification without deletion authority.

## Existing project references
- [`../../DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md)
- [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md)
- [`../DAILY_INVENTORY_RULES.md`](../DAILY_INVENTORY_RULES.md)
- [`../PLATFORM_ARCHITECTURE.md`](../PLATFORM_ARCHITECTURE.md)
- [`../PLATFORM_API.md`](../PLATFORM_API.md)
- [`../PLATFORM_DEPLOYMENT.md`](../PLATFORM_DEPLOYMENT.md)
- [`../../SECURITY.md`](../../SECURITY.md)
- [`../../PRODUCTION_AUDIT.md`](../../PRODUCTION_AUDIT.md)

## Maintenance contract
Every PR that changes architecture, workflow semantics, security boundaries, deployment procedure, persistent schema, public API contracts, design-system rules, environment configuration, secret policy, or required operational tooling MUST update the relevant chapter/index. Broken links are defects. Documentation-only changes must still be reviewed for correctness against current code.
