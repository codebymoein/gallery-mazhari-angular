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
Wave 0 is complete. Wave 1 implementation slices through PR-015 are complete on the approved `main` lineage. Wave 2 design-system work PR-016/PR-017 is complete. PR-018 removed the proven dormant direct Angular WordPress/WooCommerce product path. PR-019 added a dedicated RM-09 static-analysis evidence workflow, but post-merge artifact inspection showed its dependency analyzer still processed zero modules and the remaining analyzer steps were skipped while job-level `continue-on-error` obscured the failure.

The current permitted work is therefore the focused **RM-09 PR-019+ corrective evidence slice**: make dependency-cruiser, Knip and jscpd produce complete trustworthy evidence and make analyzer-health failures visible. No additional legacy deletion is authorized until that evidence is complete. After trustworthy evidence exists, RM-09 continues through small one-capability/path deletion PRs with consumer/runtime-history proof. PR-020 / RM-12 SSR/prerender begins only after the current RM-09 cleanup gate is deliberately closed or the owner explicitly advances the Roadmap.

This file records sequence/context only; the Master Remediation Roadmap remains authoritative for scope and ordering.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation sequence, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
