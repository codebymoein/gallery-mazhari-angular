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
Wave 0 is complete. Wave 1 is active. PR-003 through PR-012 have been completed on the approved `main` lineage. PR-012 completed the media storage foundation and was merged at `main@d830e24bb66f549d563964c59d910d52c535a3ff`. The current permitted slice is PR-013 under RM-10 — secure media processing: fail-closed malware scanning, decode/dimension validation, metadata stripping, durable Object Storage derivatives and read-only storage/database reconciliation while preserving the existing photo/media queue, orphan/quarantine and product attachment workflows. PR-013 does not authorize deleting legacy originals or starting adjacent RM-11 backup/DR work. This file records sequence/context only; each RM document and the Master Remediation Roadmap remain authoritative for scope.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation sequence, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
