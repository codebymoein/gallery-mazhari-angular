# 14 — Deployment & Operations

Production deployment must remain traceable to a reviewed revision and MUST NOT copy partial build output over live files.

## Immutable release baseline

RM-11 PR-014 establishes the deploy contract:

- `.github/workflows/release-artifact.yml` builds frontend/backend from one Git SHA and publishes a tarball plus SHA-256 checksum.
- The artifact contains `REVISION` and `BUILD.json` provenance plus frontend, backend runtime dependencies and the versioned `deploy/` tooling.
- `/srv/gallery-mazhari/releases/<sha>` is immutable after extraction.
- `/srv/gallery-mazhari/current` is the only live symlink. `deploy/release.sh` verifies checksum/revision, runs migrations before activation, atomically swaps the symlink and restarts the supervised backend.
- A host-level `flock` prevents concurrent deploy invocations. If backend restart fails after the switch, the previous symlink is restored when available.
- Nginx serves `/srv/gallery-mazhari/current/frontend`; systemd starts `/srv/gallery-mazhari/current/backend/dist/main.js`.

## Release sequence
1. Verify approved commit and required checks.
2. Build/download the release artifact for that exact SHA and verify the published checksum.
3. Confirm environment configuration/secrets and backup readiness.
4. Execute the release script as the deployment principal; do not manually edit files under a release directory.
5. The release script applies compatible migrations before the symlink switch.
6. After activation, perform health/smoke/monitoring checks. Expanded health/version/alerting and rollback rehearsal are PR-015 scope.

## Operational rules
- No manual production code edits as normal deployment practice.
- Environment variables are validated; production secrets are not copied into repository files.
- Release directories are immutable and must not be reused for another SHA.
- Static/media paths, API proxying, HTTPS/security headers and cache policy must be explicit in reverse-proxy configuration.
- Long-running jobs and migrations require operational visibility; do not terminate/retry blindly.
- A failed deployment must be reported as failed even if a previous release remains healthy.

## Rollback boundary

PR-014 preserves the previous release target and restores it automatically on immediate backend restart failure. Full rollback rehearsal, health/version evidence and operational rollback runbooks are completed in PR-015. Code rollback is never permission to restore an older database over newer valid business transactions.

References: [`../PLATFORM_DEPLOYMENT.md`](../PLATFORM_DEPLOYMENT.md), [`../SERVER_DEPLOYMENT_HANDOFF_FA.md`](../SERVER_DEPLOYMENT_HANDOFF_FA.md), [`../../deploy/nginx.conf.example`](../../deploy/nginx.conf.example), [`../../deploy/release.sh`](../../deploy/release.sh).
