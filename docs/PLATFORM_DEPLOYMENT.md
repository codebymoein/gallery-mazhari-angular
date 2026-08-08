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

## Deploy
Use the immutable artifact/checksum with `deploy/release.sh`. The script verifies the outer SHA-256 checksum, extracts to a staging directory, and then delegates the extracted release contract to the versioned `deploy/certify-release-candidate.sh` shipped inside that exact artifact. That single certification boundary validates `REVISION`/`BUILD.json`, backend and SSR output, required deployment tooling, and a valid Angular browser entry point (`index.html` or `index.csr.html`) before migrations or activation can proceed. The release script refuses release-directory reuse, serializes concurrent deployments with `flock`, runs TypeORM migrations from the exact certified release, atomically switches `current`, and restarts the supervised backend and SSR runtimes.

After activation verify:
- `GET /api/ops/health/live`
- `GET /api/ops/health/ready`
- `GET /api/ops/version`
- structured application/request logs
- monitoring/alert path

## Backup and restore drill
PR-014 backup jobs create encrypted PostgreSQL and off-server media backups. PR-015 adds `deploy/restore-postgres.sh` for an explicit non-production drill. The restore helper refuses `NODE_ENV=production`, requires `RESTORE_TARGET_ENV` to be exactly `staging`, `recovery`, or `test`, requires the exact non-production acknowledgement, verifies the encrypted backup checksum, decrypts only to a temporary file, and executes `pg_restore --exit-on-error` against `RESTORE_DATABASE_URL`.

The Deployment Tooling workflow includes an isolated PostgreSQL 16 restore drill, matching the repository's supported PostgreSQL CI baseline. It creates a clean source and recovery database, writes an integrity marker, creates an encrypted custom-format backup through the production backup helper, restores it through the production restore helper, and verifies the marker in the clean recovery database. This is automated restorability evidence; it does not authorize a production restore.

Restore success MUST also be followed in staging/incident recovery by schema/migration checks, representative row-count and critical-workflow validation, media-reference checks where applicable, and health/version evidence. Production restore remains an incident-authority action and is not authorized by the drill helper.

## Rollback
`deploy/rollback-release.sh <target-release-sha>` switches only to an existing immutable release, restarts the backend and requires readiness to pass. If the rollback target fails restart/readiness, the previous symlink is restored when available.

Application rollback never means database rollback. Do not restore an old PostgreSQL snapshot over newer valid business transactions. A target release must be compatible with already-applied migrations or the operator must use an approved roll-forward/recovery plan.

## Monitoring and alerts
NestJS emits JSON logs and request IDs. Operational endpoints expose safe liveness, PostgreSQL readiness, release provenance and Prometheus-text process metrics. `deploy/health-check.sh` verifies systemd process state plus readiness and can deliver a generic alert through a protected host-configured `ALERT_WEBHOOK_URL`.

Backup failure, storage/disk exhaustion and external provider signals must also be monitored by infrastructure. Application health must not be used as proof that backups succeeded.

## Verification
`.github/workflows/deployment-tooling.yml` validates deployment/backup/restore/rollback/health scripts with `bash -n` and ShellCheck, proves the restore helper refuses execution when `NODE_ENV=production`, and performs an encrypted backup-to-clean-database restore drill with data-integrity verification. Backend regression tests cover readiness success/failure, safe version output and metrics shape. Staging rollback rehearsal and environment-specific alert delivery evidence remain required before production certification.
