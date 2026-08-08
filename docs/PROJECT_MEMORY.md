# Gallery Mazhari Project Memory

Status: **Operational context; subordinate to `CONSTITUTION.md` and the Engineering Handbook.**

## Repository
- Authoritative repository: `codebymoein/gallery-mazhari-angular`
- Default integration branch: `main`
- RM-00 established the remediation baseline lineage. New remediation work starts from the current approved `main`, never from reused/diverged work branches.

## Architecture
- Frontend: Angular 21 with server-side rendering/hydration for indexable public routes and client rendering for private/admin routes.
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
Wave 0 is complete. Wave 1 implementation slices through PR-015 are complete on the approved `main` lineage. Wave 2 design-system work PR-016/PR-017 is complete. PR-018 removed the proven dormant direct Angular WordPress/WooCommerce product path. PR-019 attempted to establish RM-09 evidence but its analyzer job was invalid; corrective PR #40 produced the first trustworthy RM-09 dependency/dead-code/duplication evidence. PR #41 then retired the proven one-off WordPress migration preparation/reconciliation tools and merged at `main@d9844c1a67246f267751c539ad1d7b15c34b808a`. The final approved RM-09 cleanup slice merged via PR #42, closing the legacy-removal gate and allowing Wave 3 to begin.

PR-020 / RM-12 establishes the SSR/hydration foundation: indexable public routes are server-rendered, private/admin routes remain client-rendered with noindex policy, unknown routes return a true HTTP 404, browser-only effects are guarded for server execution, and the immutable release/deployment path includes a supervised Angular SSR runtime. Dedicated RM-12 CI evidence verifies the production server bundle, raw HTML title/description/canonical output, and true 404 behavior. Accessibility contrast debt remains explicitly deferred to RM-14 and is non-blocking for this slice.

After PR-020 is merged on the approved `main` lineage, the next Roadmap slice is PR-021 under RM-12 for dynamic entity metadata, structured-data lifecycle, sitemap indexes and redirect/canonical governance. RM-13 performance/CWV and RM-14 accessibility remediation remain separate subsequent programs.

This file records sequence/context only; the Master Remediation Roadmap remains authoritative for scope and ordering.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation sequence, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
