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

## Post-remediation product development model
- New product ideas and changes are captured first in `docs/product/BACKLOG.md`; a backlog entry is not direct implementation authority.
- `docs/product/PRODUCT_ROADMAP.md` groups work by product epic and priority without replacing repository governance.
- Material features use `docs/product/FEATURE_TEMPLATE.md` to define outcome, classification, impact, acceptance criteria, implementation boundaries, verification and recovery before code.
- `docs/engineering/DEVELOPMENT_WORKFLOW.md` governs the lifecycle from intake through focused PR, review, acceptance and release.
- `docs/engineering/DEFINITION_OF_DONE.md` is the completion contract for post-remediation product changes.
- Product feature growth must reuse existing architecture/source-of-truth boundaries rather than recreating local/browser authority, duplicate backend paths or ad-hoc persistent state.

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
- Production certification protocol: `docs/release/PRODUCTION_CERTIFICATION.md`
- Release risk register: `docs/release/OPEN_RISK_REGISTER.md`

## Current remediation and release state
Wave 0 and Waves 1–3 implementation slices are complete on the approved `main` lineage. RM-12 SSR/SEO, RM-13 browser/CWV and RM-14 accessibility evidence are established as permanent regression gates.

PR-024 / RM-14 merged at `main@ab168119bced3f3809aa5764f6be5364da98794e`, adding focus management, expanded Axe/keyboard/reflow evidence and the manual VoiceOver/NVDA acceptance protocol.

PR-025 / RM-17 release-certification tooling is merged at `main@7a9a584d4056a02e65d6064bb02030fb8a410ddd`. The tooling establishes exact-SHA release provenance validation, production-like crawler/smoke evidence and the governed production certification protocol. Production Business UAT, open-risk disposition, rollback/restore rehearsal evidence and controlled-launch GO remain human/release activities governed by `docs/release/PRODUCTION_CERTIFICATION.md`; automated evidence cannot replace human approval.

Post-remediation product development may be planned through the canonical product backlog/workflow, but it must not be confused with production certification or used to bypass release gates for the current launch.

This file records sequence/context only; the Master Remediation Roadmap remains authoritative for remediation scope and ordering, while the canonical product/development documents govern future feature intake and delivery.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation/release state, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
