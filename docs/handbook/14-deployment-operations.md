# 14 — Deployment & Operations

Production deployment must remain traceable to a reviewed revision and MUST NOT copy partial build output over live files.

## Immutable release baseline

RM-11 PR-014 establishes the deploy contract and RM-12 PR-020 extends the frontend artifact with a supervised Angular SSR runtime:

- `.github/workflows/release-artifact.yml` builds frontend/backend from one Git SHA and publishes a tarball plus SHA-256 checksum.
- The artifact contains `REVISION` and `BUILD.json` provenance plus frontend browser/server output, frontend production runtime dependencies, backend runtime dependencies and the versioned `deploy/` tooling.
- `/srv/gallery-mazhari/releases/<sha>` is immutable after extraction.
- `/srv/gallery-mazhari/current` is the only live symlink. `deploy/release.sh` verifies checksum/revision, runs migrations before activation, atomically swaps the symlink and restarts both supervised backend and SSR services.
- A host-level `flock` prevents concurrent deploy invocations. If application runtime restart fails after the switch, the previous symlink is restored when available.
- Nginx serves immutable browser assets from `/srv/gallery-mazhari/current/frontend/browser` and proxies storefront document requests to the supervised Angular SSR process on `127.0.0.1:4000`.
- systemd starts NestJS from `/srv/gallery-mazhari/current/backend/dist/main.js` and Angular SSR from `/srv/gallery-mazhari/current/frontend/server/server.mjs`.

## Release sequence
1. Verify approved commit and required checks.
2. Build/download the release artifact for that exact SHA and verify the published checksum.
3. Confirm environment configuration/secrets and backup readiness.
4. Execute the release script as the deployment principal; do not manually edit files under a release directory.
5. The release script applies compatible migrations before the symlink switch.
6. After activation, verify `/api/ops/health/live`, `/api/ops/health/ready`, `/api/ops/version`, an SSR storefront document request, logs and monitoring before declaring the release healthy.

## Operational rules
- No manual production code edits as normal deployment practice.
- Environment variables are validated; production secrets are not copied into repository files.
- Release directories are immutable and must not be reused for another SHA.
- Static/media paths, API proxying, HTTPS/security headers and cache policy must be explicit in reverse-proxy configuration.
- The SSR process is a presentation runtime only; it MUST NOT become a second business API or persistence authority.
- Long-running jobs and migrations require operational visibility; do not terminate/retry blindly.
- A failed deployment must be reported as failed even if a previous release remains healthy.

## Rollback contract

`deploy/rollback-release.sh <target-release-sha>` performs an explicit code-release rollback under the same host `flock` used for deploys. The target MUST already exist as an immutable release and its `REVISION` metadata MUST match the requested SHA. The script atomically swaps `/srv/gallery-mazhari/current`, restarts both backend and SSR services, then requires backend readiness and an SSR storefront probe to pass. If the selected rollback target fails restart/readiness, the previous symlink is restored when available.

A release rollback **does not roll PostgreSQL backward**. Operators MUST NOT restore an old database snapshot over newer valid business transactions merely to match an older application release. Rollback candidates therefore require migration compatibility; if a migration is not backward compatible, use the documented roll-forward/recovery plan instead of blindly selecting an older release.

## Rehearsal evidence
Before production certification, staging/recovery rehearsal MUST record:
- source and target release SHAs;
- start/end time and observed rollback duration;
- readiness/version evidence after the switch;
- SSR raw-HTML/status evidence after the switch;
- confirmation that database state was not destructively reverted;
- any failed probe/restart and automatic prior-symlink restoration evidence.

References: [`../PLATFORM_DEPLOYMENT.md`](../PLATFORM_DEPLOYMENT.md), [`../SERVER_DEPLOYMENT_HANDOFF_FA.md`](../SERVER_DEPLOYMENT_HANDOFF_FA.md), [`../../deploy/nginx.conf.example`](../../deploy/nginx.conf.example), [`../../deploy/release.sh`](../../deploy/release.sh), [`../../deploy/rollback-release.sh`](../../deploy/rollback-release.sh), [`../../deploy/gallery-mazhari-ssr.service.example`](../../deploy/gallery-mazhari-ssr.service.example).
