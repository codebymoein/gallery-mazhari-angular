# Gallery Mazhari Project Memory

Status: **Operational context; subordinate to `CONSTITUTION.md` and the Engineering Handbook.**

## Repository
- Authoritative repository: `codebymoein/gallery-mazhari-angular`
- Default integration branch: `main`
- New work starts from the current approved `main`; stale/diverged work branches are not reused.

## Architecture
- Frontend: Angular 21 with server-side rendering/hydration for indexable public routes and client rendering for private/admin routes.
- Backend: NestJS 11.
- Persistence: TypeORM with PostgreSQL as the production system of record.
- Angular owns presentation/client orchestration; NestJS owns authoritative business logic, authorization, validation, workflow transitions, jobs and persistence orchestration.
- Media binary storage is behind the NestJS `MediaStorageService` boundary. Production uses S3-compatible Object Storage; PostgreSQL remains authoritative for media metadata, workflow state, attachment and audit. Public and private/quarantine objects are separate namespaces.

## Protected Gallery Mazhari workflows
The following are intentional product systems and must not be deleted, flattened or bypassed for convenience: Excel inventory import; dry-run/confirm import; product/variation workflow; photo/media queue; orphan/quarantine handling; staging/publish queue; stock lifecycle/audit; taxonomy; SEO enrichment; merchandising; orders/payments; consultations; custom requests; and related approval/audit gates.

## Current remediation/release state
- Waves 0–3 remediation work is complete on the approved `main` lineage.
- RM-12 SSR/SEO, RM-13 browser/Core Web Vitals and RM-14 accessibility evidence are permanent regression controls rather than active cleanup backlogs.
- RM-17 production certification/controlled launch is the only active remediation/release program.
- Release certification tooling is merged; Business UAT, open-risk disposition, rollback/restore evidence and controlled-launch GO remain human/release activities governed by `docs/release/PRODUCTION_CERTIFICATION.md`.
- `docs/remediation/MASTER_REMEDIATION_ROADMAP.md` intentionally contains only active/current remediation context. Completed 381-finding detail and PR sequencing remain recoverable from Git history and merged PRs rather than being loaded into every new agent session.

## Deployment / V2 rollout
- The release-activation contract delegates extracted-artifact validation to the versioned exact-SHA certifier rather than maintaining a second browser-entrypoint contract.
- The non-public `v2.gallerymazhari.com` environment uses an immutable automatic rollout model: each reviewed `main` merge produces an exact-SHA `auto-v2-<sha>` prerelease on GitHub; the VPS polls outbound over HTTPS, verifies and activates that artifact through the canonical release path, then health/provenance-checks it.
- A V2-only atomic static-browser compatibility bridge remains until its existing Nginx host is deliberately migrated to the canonical SSR reverse proxy.
- V2 automation is not production GO and does not replace RM-17 human release authorization.

## Repository hygiene
- Obsolete early-phase documents that described superseded WordPress/Angular architecture or duplicate feature planning are removed once proven to have no active operational consumer.
- `PHASE1_COMPLETION.md` and `IMPLEMENTATION_CHECKLIST.md` are retired from the active tree; Git history remains the recovery record.
- `PRODUCTION_AUDIT.md` remains historical evidence while production certification is active.
- `MEDIA_DEPLOYMENT.md` and deployment handoff material remain only where current media/release operations still consume them.
- Further executable-code deletion requires candidate-specific usage/runtime/history proof; static-analysis findings alone are not deletion authority.
- Repository-hygiene documentation work does not authorize additional runtime/code deletion; any later cleanup requires its own scoped evidence and review.

## Post-remediation product development model
- New product ideas and changes are captured first in `docs/product/BACKLOG.md`; a backlog entry is not direct implementation authority.
- `docs/product/PRODUCT_ROADMAP.md` groups work by product epic and priority without replacing repository governance.
- Material features use `docs/product/FEATURE_TEMPLATE.md` to define outcome, classification, impact, acceptance criteria, implementation boundaries, verification and recovery before code.
- `docs/engineering/DEVELOPMENT_WORKFLOW.md` governs the lifecycle from intake through focused PR, review, acceptance and release.
- `docs/engineering/DEFINITION_OF_DONE.md` is the completion contract for post-remediation product changes.
- Product feature growth must reuse existing architecture/source-of-truth boundaries rather than recreating local/browser authority, duplicate backend paths or ad-hoc persistent state.

## Verification operating model
- Agent verification is risk-based and proportional to the actual final diff, using Tier A/B/C in `docs/handbook/10-testing-quality.md`.
- Isolated frontend presentation changes use focused frontend evidence; they do not require unrelated backend, PostgreSQL, security, release-certification, sitemap, Lighthouse, or full Playwright execution solely because a file changed.
- Frontend behavior/public-experience changes add relevant unit, production build and focused browser evidence; cross-boundary, security, data, workflow, dependency, deployment and certification work escalates to the broad applicable gate set.
- GitHub PR CI uses the same risk model: `quality-gates.yml` classifies changed surfaces and skips non-applicable blocking jobs while keeping governance, secret scanning and the stable aggregate required-check result.
- RM-09/RM-12/RM-13/RM-17 evidence workflows are path-scoped to their actual risk boundaries; explicit `workflow_dispatch` remains available for broader certification when required.
- The broad `push` duplicate was removed from `quality-gates.yml`; reviewed `main` merges continue to use the separate exact-SHA release/deployment workflows instead of repeating the entire PR matrix.
- Agents may not weaken CI or relabel failing relevant gates as not applicable.
- Explicit task, PR, release or certification contracts can require broader evidence than the tier minimum.

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
- Deployment/runtime contract including V2 automatic rollout: `docs/PLATFORM_DEPLOYMENT.md` and Handbook 14.

## Updating this file
Update Project Memory when repository-wide operating facts change: architecture authority, canonical workflows, governance process, active remediation/release state, canonical operations documentation, or durable handoff information. Do not use it as a scratchpad, secret store, duplicate audit ledger or substitute for task-specific documentation.
