# Gallery Mazhari Engineering Handbook

This is version-controlled Living Documentation for the real Angular + NestJS + TypeORM/PostgreSQL system in this repository. Normative precedence: `CONSTITUTION.md` → `AGENTS.md` agent-entry contract → the Master Remediation Roadmap for remediation scope/sequencing → this handbook → task-specific docs → implementation comments. Existing specialized docs remain valuable evidence and must be reconciled rather than silently contradicted.

> **Agent entry rule:** New AI/automation sessions MUST start at [`../../AGENTS.md`](../../AGENTS.md), complete its mandatory preflight, read the Constitution, Roadmap, this index and required chapters, then provide the pre-write report before material edits. Opening this Handbook directly does not waive the `AGENTS.md` preflight.

## Canonical remediation authority
- [`../remediation/MASTER_REMEDIATION_ROADMAP.md`](../remediation/MASTER_REMEDIATION_ROADMAP.md) — authoritative 381-finding remediation program, Wave/RM/PR sequence, dependencies, exit criteria, Definition of Done and coverage manifest.
- [`../governance/AGENT_TASK_MANIFEST.md`](../governance/AGENT_TASK_MANIFEST.md) — mandatory task-scoping and acknowledgement contract for material agent work.
- [`../governance/NEW_AGENT_BOOTSTRAP.md`](../governance/NEW_AGENT_BOOTSTRAP.md) — reusable instructions for starting a new chat/agent without trusting stale copied state.

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

## Minimum mandatory reading for every material task
Every agent MUST read chapters **01, 02, 03, 07, 10, 11 and 12**, plus task-specific chapters identified by `AGENTS.md`. Reading only a summary is insufficient when full repository file access is available.

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
Every PR that changes architecture, workflow semantics, security boundaries, deployment procedure, persistent schema, public API contracts, design-system rules, environment configuration, secret policy, required operational tooling, remediation sequencing, or governance MUST update the relevant chapter/index when necessary. Broken links are defects. Documentation-only changes must still be reviewed for correctness against current code.

No agent may weaken Constitution/AGENTS/Roadmap/Handbook controls as part of an unrelated task. Governance weakening requires an explicit governance-scoped PR and human-owner rationale.
