# Deployment, Migration, Backup Baseline

This document describes the RM-11 PR-014 baseline. It does not certify restore/monitoring/rollback rehearsal; those are PR-015.

## Source artifact

Production releases MUST come from `.github/workflows/release-artifact.yml` for one exact Git SHA. The workflow builds Angular and NestJS, retains backend production runtime dependencies, packages the versioned `deploy/` tooling, writes `REVISION`/`BUILD.json`, and publishes the release tarball with its SHA-256 checksum.

Do not rebuild or edit a production release on the server.

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

Install the example systemd/nginx configuration with host-specific domains/users/paths, then use the release artifact and checksum:

```bash
APP_ROOT=/srv/gallery-mazhari \
BACKEND_ENV_FILE=/etc/gallery-mazhari/backend.env \
./deploy/release.sh gallery-mazhari-<sha>.tar.gz gallery-mazhari-<sha>.tar.gz.sha256
```

The script verifies checksum and revision metadata, refuses release-directory reuse, serializes concurrent deployments with `flock`, extracts to a staging directory, runs TypeORM migrations from the exact release, atomically switches `current`, and restarts the supervised backend. If the immediate backend restart fails, the previous release symlink is restored when available.

A code rollback does not authorize restoring an old PostgreSQL snapshot over newer valid transactions.

## Backup jobs

`gallery-mazhari-backup.timer.example` schedules the oneshot backup service. `backend.env` supplies PostgreSQL/Object Storage runtime credentials; `backup.env` supplies backup destinations and the public `age` recipient.

- PostgreSQL: custom-format `pg_dump` -> `age` encryption -> SHA-256 -> S3-compatible off-server upload. Plaintext backups are never retained by the script.
- Media: copy-only Object Storage sync to a distinct backup target with server-side encryption. Routine backup intentionally does not delete target objects.
- Local retention applies to encrypted PostgreSQL backup artifacts. Remote lifecycle/versioning is configured at the backup storage provider.

Required host tools for this baseline include Node.js 22, `systemd`, `flock`, PostgreSQL client tools (`pg_dump`), `age`, AWS CLI compatible with the selected Object Storage provider, Nginx, and the normal TLS/DNS stack. Secrets/private recovery keys are never committed.

## Verification boundary

PR-014 validates script syntax/ShellCheck and systemd unit syntax in CI alongside the repository Quality Gates. PR-015 adds restore drill evidence, health/version reporting, structured logs/metrics/alerts and full rollback/runbooks.
