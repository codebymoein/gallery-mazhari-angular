# Gallery Mazhari Engineering Handbook

This is version-controlled Living Documentation for the real Angular + NestJS + TypeORM/PostgreSQL system in this repository. Normative precedence: `CONSTITUTION.md` → `AGENTS.md` agent-entry contract → the Master Remediation Roadmap for remediation scope/sequencing → this handbook → task-specific docs → implementation comments. Existing specialized docs remain valuable evidence and must be reconciled rather than silently contradicted.

> **Agent entry rule:** New AI/automation sessions MUST start at [`../../AGENTS.md`](../../AGENTS.md), complete its Fast Preflight Protocol, read the Constitution, Roadmap scope when applicable, this index and task-risk-selected chapters, then provide the compact pre-write report before material edits. Opening this Handbook directly does not waive the `AGENTS.md` preflight.

## Canonical remediation authority
- [`../remediation/MASTER_REMEDIATION_ROADMAP.md`](../remediation/MASTER_REMEDIATION_ROADMAP.md) — authoritative entry point for active remediation/release work; completed finding and PR detail remains in Git/PR history.
- [`../governance/AGENT_TASK_MANIFEST.md`](../governance/AGENT_TASK_MANIFEST.md) — mandatory task-scoping and acknowledgement contract for material agent work.
- [`../governance/NEW_AGENT_BOOTSTRAP.md`](../governance/NEW_AGENT_BOOTSTRAP.md) — reusable minimal instructions for starting a new chat/agent without trusting stale copied state.

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

## Fast chapter selection
Do not load every chapter for every task. Use the task-risk matrix in `AGENTS.md` and read only the chapters whose boundary is actually touched. The following compact map is an index, not a second policy:

- Material code change → 03, 10, 11, 12.
- Architecture/source-of-truth/workflow semantics → add 01, 02, 07.
- Angular/UI/client state → add 04; add 08 and/or 17 when applicable.
- NestJS/API/business logic → add 05; add 09 for security-sensitive behavior.
- Database/schema/migrations/import persistence → add 06 and 07.
- Media/uploads → add 09 and 13.
- Deployment/runtime → add 14 and, as applicable, 15/16.
- Documentation/governance-only → 11, 12, 18 unless the governance change modifies another domain contract.

If a selected chapter links another document as mandatory for the touched behavior, read that linked document too. If task scope expands, expand the reading set before making out-of-boundary writes. A summary or previous chat memory is not a substitute for a required source when repository access is available.

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
