# Gallery Mazhari Project Memory

Status: **Operational context; subordinate to `CONSTITUTION.md` and the Engineering Handbook.**

## Repository
- Authoritative repository: `codebymoein/gallery-mazhari-angular`
- Default integration branch: `main`
- RM-00 established the remediation baseline lineage. New remediation work starts from the current approved `main`, never from reused/diverged work branches.

## Architecture
- Frontend: Angular 21.
- Backend: NestJS 11.
- Persistence: TypeORM with PostgreSQL as the production system of record.
- Angular owns presentation/client orchestration; NestJS owns authoritative business logic, authorization, validation, workflow transitions, jobs and persistence orchestration.
- Media binary storage is behind the NestJS `MediaStorageService` boundary. Production uses S3-compatible Object Storage; PostgreSQL remains authoritative for media metadata, workflow state, attachment and audit. Public and private/quarantine objects are separate namespaces.

## Protected Gallery Mazhari workflows
The following are intentional product systems and must not be deleted, flattened or bypassed for convenience: Excel inventory import; dry-run/confirm import; product/variation workflow; photo/media queue; orphan/quarantine handling; staging/publish queue; stock lifecycle/audit; taxonomy; SEO enrichment; merchandising; orders/payments; consultations; custom requests; and related approval/audit gates.

## Remediation operating model
- Master Remediation Roadmap controls implementation scope and Wave gates.
- A raw audit finding is not permission to modify code.
- One focused branch/PR per approved remediation purpose unless the Roadmap explicitly groups programs.
- No adjacent RM program starts opportunistically.
- Every PR states base SHA, scope/non-scope, risk, verification evidence and rollback/recovery.

## Agent operating rules
- Start with `AGENTS.md`.
- Read `CONSTITUTION.md`, handbook index and task-relevant chapters before edits.
- Read the current Agent Task Manifest for the assigned work.
- Inspect real implementation/tests/docs; do not infer repository behavior from framework conventions.
- Preserve unrelated user/agent work.
- Never expose or commit secrets, credentials, private data or production dumps.
- Never push directly to `main` or self-merge without explicit owner authorization.

## Canonical operations documentation
- Environment contract: `docs/operations/ENVIRONMENT.md`
- Secret management/rotation: `docs/operations/SECRETS.md`
- Tool/migration manifest: `docs/operations/TOOL_MANIFEST.md`
- Documentation ownership/index: `docs/DOCUMENTATION_INDEX.md`
- Legacy/stale document classification: `docs/operations/STALE_DOCUMENT_REGISTER.md`

## Current remediation sequence
Wave 0 is complete. Wave 1 is active. PR-003 through PR-013 have been completed on the approved `main` lineage. PR-013 completed secure media processing and was merged at `main@4ad472fe70600d8225f5fe9986ef046b848f7c3b`. The current permitted slice is PR-014 under RM-11 — deployment and backup baseline: immutable release artifacts, supervised backend process, atomic release activation, encrypted PostgreSQL backups and off-server media backup jobs. Restore drill, health/version endpoints, structured logs/metrics/alerts and full rollback rehearsal remain PR-015 scope. This file records sequence/context only; each RM document and the Master Remediation Roadmap remain authoritative for scope.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation sequence, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
