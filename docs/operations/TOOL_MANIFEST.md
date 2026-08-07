# Operational Tool and Migration Manifest

Status: **Canonical command index**. Commands are descriptive contracts; operators must use the reviewed revision and correct environment.

## Package installation

- Frontend/root clean install: `npm ci`
- Backend clean install: `npm --prefix backend ci`

Lockfiles are authoritative. Do not substitute ad-hoc dependency upgrades during operational work.

## Quality gates

The canonical repository CI workflow is `.github/workflows/quality-gates.yml`.

Relevant local commands include:

- Frontend tests: `npm test`
- Frontend production build: `npm run build:prod`
- Backend lint: `npm --prefix backend run lint`
- Backend tests: `npm --prefix backend test -- --runInBand`
- Backend coverage: `npm --prefix backend run test:cov -- --runInBand`
- Backend build: `npm --prefix backend run build`

The GitHub check named `Required quality gates` is the merge gate established by RM-02. Deployment tooling also has `.github/workflows/deployment-tooling.yml` for shell/systemd validation when those paths change.

## Database migrations

Run from the repository root with the canonical backend environment configured:

- Show migrations: `npm --prefix backend run migration:show`
- Apply migrations: `npm --prefix backend run migration:run`
- Revert one migration: `npm --prefix backend run migration:revert`
- Inspect entity/schema difference: `npm --prefix backend run schema:log`

Rules:

1. Production schema change occurs only through reviewed migrations.
2. Never use schema synchronization as an operational migration mechanism.
3. Existing schema drift is owned by RM-05; this manifest does not authorize changing entities/migrations in RM-16.
4. Backup/restore readiness and production rollout are governed by the deployment/DR handbook and RM-11.

## Release tooling

- Immutable release artifact workflow: `.github/workflows/release-artifact.yml`.
- Atomic host activation: `deploy/release.sh <artifact.tar.gz> <artifact.tar.gz.sha256>`.
- Backend supervision example: `deploy/gallery-mazhari-backend.service.example`.
- Nginx production-path example: `deploy/nginx.conf.example`.

Host requirements for the baseline: Node.js 22, systemd, util-linux `flock`, Nginx and PostgreSQL client/runtime tooling appropriate to the deployment host.

## Backup tooling

- PostgreSQL encrypted backup: `deploy/backup-postgres.sh`.
- Object Storage media copy backup: `deploy/backup-media.sh`.
- Scheduled oneshot service/timer examples: `deploy/gallery-mazhari-backup.service.example` and `deploy/gallery-mazhari-backup.timer.example`.
- Non-secret configuration shape: `deploy/backup.env.example`.

Backup host requirements include `pg_dump`, `age`, AWS CLI compatible with the configured S3 provider, and credentials supplied outside Git. Restore tooling/evidence is PR-015 scope; backup commands are not restore authorization.

## Supported product/import tooling

The supported product/inventory ingestion path is the reviewed application workflow: Excel upload -> dry-run/validation -> human confirmation -> NestJS/PostgreSQL commit/upsert -> inventory/media/review/publication processing. Operators must use the current application/API workflow and its documented controls rather than standalone migration scripts.

The historical one-off scripts `scripts/prepare-wordpress-migration.mjs` and `scripts/reconcile-wordpress-with-inventory.mjs` were retired under RM-09 after valid static-analysis evidence plus consumer/package/history inspection showed no supported caller. They are **not** operational commands and must not be recreated as a parallel product/inventory authority. Any future external migration utility requires an explicit scoped contract, owner, input/output validation, reconciliation/rollback plan and documentation here.

`backend/scripts/tag-products-from-descriptions.ts` is also retired under RM-09. It was a one-off direct SQLite tag backfill and is not a supported operational taxonomy command. Taxonomy/tagging business state must flow through the current NestJS/PostgreSQL platform and its approval/audit semantics; the reusable tagging engine remains part of the supported codebase.

## Security tools

- Gitleaks: required CI secret scan.
- `npm audit --package-lock-only --omit=dev --audit-level=high`: frontend/root production dependency audit.
- `npm --prefix backend audit --package-lock-only --omit=dev --audit-level=high`: backend production dependency audit.

## Static debt reports

RM-02 produces report artifacts for Stylelint, Dependency Cruiser and Knip. RM-09 also runs `.github/workflows/rm09-static-analysis.yml` to produce validated dependency-cruiser, Knip and jscpd evidence. Existing findings are evidence for their owning remediation program; reports are not permission for bulk deletion or unrelated refactors.

## Ownership and updates

Any PR that renames a command, workflow, migration entry point or operational tool must update this manifest in the same PR.
