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

The GitHub check named `Required quality gates` is the merge gate established by RM-02.

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

## Security tools

- Gitleaks: required CI secret scan.
- `npm audit --package-lock-only --omit=dev --audit-level=high`: frontend/root production dependency audit.
- `npm --prefix backend audit --package-lock-only --omit=dev --audit-level=high`: backend production dependency audit.

## Static debt reports

RM-02 produces report artifacts for Stylelint, Dependency Cruiser and Knip. Existing debt is evidence for its owning remediation program; reports are not permission for bulk deletion or unrelated refactors.

## Ownership and updates

Any PR that renames a command, workflow, migration entry point or operational tool must update this manifest in the same PR.
