# Deployment, Restore, Monitoring, and Rollback

This document describes the RM-11 operational baseline established by PR-014 and extended by PR-015.

## Source artifact
Production releases MUST come from `.github/workflows/release-artifact.yml` for one exact Git SHA. The workflow builds Angular and NestJS, retains backend production runtime dependencies, packages the versioned `deploy/` tooling, writes `REVISION`/`BUILD.json`, and publishes the release tarball with its SHA-256 checksum. Do not rebuild or edit a production release on the server.

## Host layout
```text
/srv/gallery-mazhari/
  releases/<git-sha>/
  current -> /srv/gallery-mazhari/releases/<git-sha>
  LAST_DEPLOYED_REVISION
/etc/gallery-mazhari/backend.env
/etc/gallery-mazhari/backup.env
/var/backups/gallery-mazhari/
```

Nginx serves `/srv/gallery-mazhari/current/frontend`. The backend systemd unit runs `/srv/gallery-mazhari/current/backend/dist/main.js`.

The backend must remain bootable when the host CPU cannot load Sharp's optional
native image runtime. Image-processing entry points load Sharp on demand and fail
closed with a service-unavailable response when it is unsupported; health,
catalog, authentication and other non-image APIs must remain available. Restore
image processing by moving the V2 workload to a CPU/runtime supported by the
locked Sharp release, not by editing an immutable release or downgrading to a
vulnerable image library.

## Deploy
Use the immutable artifact/checksum with `deploy/release.sh`. The script verifies the outer SHA-256 checksum, extracts to a staging directory, and then delegates the extracted release contract to the versioned `deploy/certify-release-candidate.sh` shipped inside that exact artifact. That single certification boundary validates `REVISION`/`BUILD.json`, backend and SSR output, required deployment tooling, and a valid Angular browser entry point (`index.html` or `index.csr.html`) before migrations or activation can proceed. The release script refuses release-directory reuse, serializes concurrent deployments with `flock`, runs TypeORM migrations from the exact certified release, atomically switches `current`, and restarts the supervised backend and SSR runtimes.

After activation verify:
- `GET /api/ops/health/live`
- `GET /api/ops/health/ready`
- `GET /api/ops/version`
- structured application/request logs
- monitoring/alert path

## Automatic V2 rollout
`v2.gallerymazhari.com` is the non-public pre-production host. Once its one-time host bootstrap is installed, every reviewed merge to `main` follows this automatic path:

1. `.github/workflows/release-artifact.yml` builds the exact merged SHA on a GitHub-hosted Ubuntu runner; no production build occurs on the VPS.
2. The workflow keeps the Actions artifact and also publishes the tarball/checksum as a uniquely tagged prerelease named `auto-v2-<git-sha>`. The `auto-v2-` prefix deliberately does not match the separate `v*` release-tag trigger.
3. `gallery-mazhari-v2-auto-deploy.timer` runs on the VPS every two minutes. It makes an outbound HTTPS request to the public GitHub Releases API, so inbound SSH or a long-lived GitHub token on the host is not required.
4. `deploy/v2-auto-deploy.sh` accepts only a complete `auto-v2-<40-character-sha>` release, downloads the exact tarball/checksum, verifies SHA-256, then runs the artifact's own `deploy/release.sh` against `/srv/gallery-mazhari`.
5. The new backend and SSR runtimes must pass readiness and exact `/api/ops/version` provenance checks before the rollout is considered healthy. On a failed first migration the legacy API service is restored; on later failures the immutable prior release is selected through the canonical rollback helper when possible.
6. The current V2 Nginx host still serves `/var/www/gallery-mazhari/browser` as a static compatibility path. Only after the new exact-SHA backend/SSR release is healthy, the poller atomically publishes the certified browser output there. If Angular emits only `index.csr.html`, the V2 bridge creates `index.html` from that certified browser entry point. This bridge exists only so the current V2 host reflects each merge without rewriting a potentially shared Nginx server block.

The V2 compatibility bridge is **not** the final production reverse-proxy architecture. Production still requires the canonical SSR Nginx configuration, Business UAT, risk disposition, rollback/restore rehearsal and explicit launch authorization. Automatic V2 rollout must not be interpreted as automatic production GO.

### One-time V2 host bootstrap
Run `deploy/install-v2-auto-deploy.sh` once from a clean checkout of the reviewed `main`. It creates the least-privileged `gallerymazhari` service account when absent, prepares `/srv/gallery-mazhari`, migrates an already-existing backend environment file into `/etc/gallery-mazhari/backend.env` without printing secret values, installs the backend/SSR and V2 poller systemd units, enables the timer and triggers an initial poll. The legacy `gallery-mazhari-api.service` is not stopped by the installer; the poller stops it only immediately before the first canonical release activation and restores it if that activation fails.

## Backup and restore drill
PR-014 backup jobs create encrypted PostgreSQL and off-server media backups. PR-015 adds `deploy/restore-postgres.sh` for an explicit non-production drill. The restore helper refuses `NODE_ENV=production`, requires `RESTORE_TARGET_ENV` to be exactly `staging`, `recovery`, or `test`, requires the exact non-production acknowledgement, verifies the encrypted backup checksum, decrypts only to a temporary file, and executes `pg_restore --exit-on-error` against `RESTORE_DATABASE_URL`.

The Deployment Tooling workflow includes an isolated PostgreSQL 16 restore drill, matching the repository's supported PostgreSQL CI baseline. It creates a clean source and recovery database, writes an integrity marker, creates an encrypted custom-format backup through the production backup helper, restores it through the production restore helper, and verifies the marker in the clean recovery database. This is automated restorability evidence; it does not authorize a production restore.

Restore success MUST also be followed in staging/incident recovery by schema/migration checks, representative row-count and critical-workflow validation, media-reference checks where applicable, and health/version evidence. Production restore remains an incident-authority action and is not authorized by the drill helper.

## Rollback
`deploy/rollback-release.sh <target-release-sha>` switches only to an existing immutable release, restarts the backend and requires readiness to pass. If the rollback target fails restart/readiness, the previous symlink is restored when available.

Application rollback never means database rollback. Do not restore an old PostgreSQL snapshot over newer valid business transactions. A target release must be compatible with already-applied migrations or the operator must use an approved roll-forward/recovery plan.

## Monitoring and alerts
NestJS emits JSON logs and request IDs. Operational endpoints expose safe liveness, PostgreSQL readiness, release provenance and Prometheus-text process metrics. `deploy/health-check.sh` verifies systemd process state plus readiness and can optionally deliver a generic alert to `ALERT_WEBHOOK_URL`.

Backup failure, storage/disk exhaustion and external provider signals must also be monitored by infrastructure. Application health must not be used as proof that backups succeeded.

## Verification
`.github/workflows/deployment-tooling.yml` validates deployment/backup/restore/rollback/health and V2 auto-deploy scripts with `bash -n` and ShellCheck, verifies the relevant systemd unit syntax, proves the restore helper refuses execution when `NODE_ENV=production`, and performs an encrypted backup-to-clean-database restore drill with data-integrity verification. Backend regression tests cover readiness success/failure, safe version output and metrics shape. Staging rollback rehearsal and environment-specific alert delivery evidence remain required before production certification.
